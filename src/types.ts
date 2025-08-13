import type { StateTree } from 'pinia'
import type { MaybeRef } from 'vue'
import type * as Y from 'yjs'

export interface YjsStateOptions {
  doc?: MaybeRef<Y.Doc | null>
  sharing?: MaybeRef<boolean | string>
}

export interface YjsStateFactoryOptions {
  doc?: MaybeRef<Y.Doc | null>
  sharing?: MaybeRef<boolean | string>
}

declare module 'pinia' {
  // eslint-disable-next-line unused-imports/no-unused-vars
  export interface DefineStoreOptionsBase<S extends StateTree, Store> {
    doc?: MaybeRef<Y.Doc | null>

    /**
     * enables sharing of state between clients via Yjs.
     */
    sharing?: MaybeRef<boolean | string>
  }

  export interface PiniaCustomProperties {

  }
}
