import type { PiniaPlugin } from 'pinia'
import * as Y from 'yjs'
import type { ShallowRef } from 'vue'
import { shallowRef, watch } from 'vue'
import { patchSharedType, patchStore } from './lib/patching'
import type { YjsStateFactoryOptions, YjsStateOptions } from './types'
import { normalizeOptions } from './normalize'

export {
  YjsStateOptions,
}

export function createPiniaYJSPlugin(
  factoryOptions: YjsStateFactoryOptions = {},
): PiniaPlugin {
  return ({ store, options,
  }) => {
    const pluginOptions = normalizeOptions(options, factoryOptions)

    // The root Y.Map that the store is written and read from.

    const docRef: ShallowRef<Y.Doc | null | undefined> = shallowRef(pluginOptions.doc)

    const clears: (() => void)[] = []

    watch(docRef, (doc) => {
      while (clears.length) {
        const clearFn = clears.pop()
        clearFn?.()
      }

      if (!doc || !pluginOptions.sharing)
        return

      function getRoot(doc: Y.Doc): [Y.Map<any>, boolean] {
        if (pluginOptions.sharing === true)
          return [doc!.getMap(`YJS-${store.$id}`), false]

        let newlyCreated = false
        if (typeof pluginOptions.sharing === 'string') {
          const steps = pluginOptions.sharing.trim().replaceAll(/@@store@@/g, `${store.$id}`).split(' ')
          let res = doc.getMap(steps[0]) as Y.Map<Y.Map<any>>
          for (const s of steps.slice(1)) {
            if (!res.has(s)) {
              newlyCreated = true
              doc.transact(() => {
                res.set(s, new Y.Map())
              })
            }
            res = res.get(s) as Y.Map<Y.Map<any>>
          }
          return [res, newlyCreated]
        }
        throw new Error('Wrong control flow')
      }
      const [map, newlyCreated] = getRoot(doc)

      const clear = store.$subscribe((_, state) => {
        const pureState = JSON.parse(JSON.stringify(state))
        patchSharedType(map, pureState)
      }, { detached: true })

      clears.push(clear)

      const handler = () => {
        patchStore(store, map.toJSON())
      }

      if (!newlyCreated)
        patchStore(store, map.toJSON())

      map.observeDeep(handler)
      clears.push(() => {
        map.unobserveDeep(handler)
      })
    }, { immediate: true })
  }
}

export default createPiniaYJSPlugin()
