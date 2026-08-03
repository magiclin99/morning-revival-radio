import { onUnmounted, ref } from 'vue'
import {
  onDisconnect,
  onValue,
  push,
  ref as dbRef,
  remove,
  serverTimestamp,
  set,
} from 'firebase/database'
import { database } from '@/firebase'

/**
 * Tracks how many clients are currently listening.
 *
 * A client only counts as a listener when `register` is true (the playback
 * page). It registers itself under `/listeners/{id}` and asks Firebase to
 * remove that entry automatically when the connection drops
 * (`onDisconnect`). Every caller — listener or not — observes the live count,
 * which is the number of children under `/listeners`. So the browse page can
 * show the count without inflating it.
 */
export function usePresence ({ register = false } = {}) {
  const listenerCount = ref(0)
  const listenersRef = dbRef(database, 'listeners')

  let myRef: ReturnType<typeof push> | null = null
  if (register) {
    myRef = push(listenersRef)
    set(myRef, serverTimestamp())
    onDisconnect(myRef).remove()
  }

  const unsubscribe = onValue(listenersRef, snapshot => {
    listenerCount.value = snapshot.size
  })

  onUnmounted(() => {
    unsubscribe()
    // Best-effort cleanup for SPA navigation; onDisconnect covers tab close.
    if (myRef) remove(myRef)
  })

  return { listenerCount }
}
