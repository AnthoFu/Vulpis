import TrackPlayer, { Event } from '@rntp/player';

export default async function playbackService() {
    // Para iOS y primer plano en Android
    TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
    TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
    TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.destroy());
    TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext());
    TrackPlayer.addEventListener(Event.RemotePrevious, () => TrackPlayer.skipToPrevious());
    TrackPlayer.addEventListener(Event.RemoteSeek, (event) => TrackPlayer.seekTo(event.position));

    // Para segundo plano en Android (Headless JS)
    return async (event) => {
        if (event.type === Event.RemotePlay) {
            TrackPlayer.play();
        } else if (event.type === Event.RemotePause) {
            TrackPlayer.pause();
        } else if (event.type === Event.RemoteStop) {
            TrackPlayer.destroy();
        } else if (event.type === Event.RemoteNext) {
            TrackPlayer.skipToNext();
        } else if (event.type === Event.RemotePrevious) {
            TrackPlayer.skipToPrevious();
        } else if (event.type === Event.RemoteSeek) {
            TrackPlayer.seekTo(event.position);
        }
    };
}
