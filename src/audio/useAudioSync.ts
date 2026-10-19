import { useEffect } from 'react'
import { useStage } from '../store/useStage'
import { setSoundEnabled, setStadiumLevel, sfx } from './engine'

/** Connects store state (sound toggle, navigation, restoration) to the audio engine. */
export function useAudioSync(): void {
  useEffect(() => {
    return useStage.subscribe((s, prev) => {
      if (s.soundOn !== prev.soundOn) void setSoundEnabled(s.soundOn)
      if (!s.soundOn) return
      if (s.section !== prev.section) {
        sfx.whoosh()
        setStadiumLevel(s.section === 'contact' ? 1 : 0)
      }
      if (s.jersey === 'restored' && prev.jersey !== 'restored') sfx.chime()
    })
  }, [])
}
