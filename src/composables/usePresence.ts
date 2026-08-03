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
 * Tracks the number of clients currently connected.
 *
 * Each browser tab registers itself under `/presence/{id}` on mount and asks
 * Firebase to remove that entry automatically when the connection drops
 * (`onDisconnect`). The online count is simply the number of children under
 * `/presence`.
 */
export function usePresence () {
  const onlineCount = ref(0)
  const presenceRef = dbRef(database, 'presence')
  const myRef = push(presenceRef)

  set(myRef, serverTimestamp())
  onDisconnect(myRef).remove()

  const unsubscribe = onValue(presenceRef, snapshot => {
    onlineCount.value = snapshot.size
  })

  onUnmounted(() => {
    unsubscribe()
    // Best-effort cleanup for SPA navigation; onDisconnect covers tab close.
    remove(myRef)
  })

  return { onlineCount }
}
