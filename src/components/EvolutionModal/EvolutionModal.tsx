import Feather from '@expo/vector-icons/Feather';
import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView, type VideoSource } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CharacterAvatar } from '@/components/CharacterAvatar/CharacterAvatar';
import { PrimaryButton } from '@/components/PrimaryButton/PrimaryButton';
import { resolveEvolutionVideo } from '@/constants/evolutionVideos';
import { Colors } from '@/constants/theme';
import { getRankInfo, type UserDTO } from '@/shared/types';

import { styles } from './EvolutionModal.styles';

export interface EvolutionCeremonySpec {
  user: UserDTO;
  fromTier: number;
  toTier: number;
  mode: 'claim' | 'replay';
}

interface EvolutionModalProps {
  ceremony: EvolutionCeremonySpec | null;
  onClose: () => void;
  onClaim?: (userId: string, toTier: number) => Promise<void>;
}

interface EvolutionVideoStageProps {
  source: VideoSource;
  fromTier: number;
  toTier: number;
  showWatchLater: boolean;
  onSkip: () => void;
  onWatchLater: () => void;
  onFinished: () => void;
}

function EvolutionVideoStage({
  source,
  fromTier,
  toTier,
  showWatchLater,
  onSkip,
  onWatchLater,
  onFinished,
}: EvolutionVideoStageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [showPlayFallback, setShowPlayFallback] = useState(false);
  const hasEndedRef = useRef(false);
  const endTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isPortraitViewport = height >= width;

  const player = useVideoPlayer(source, (p) => {
    p.loop = false;
    p.muted = false;
    p.play();
  });

  useEffect(() => {
    // On web, VideoView mounts the <video> element in a child effect after useVideoPlayer's
    // setup callback runs, so calling play() here triggers playback once mounted.
    const startTimer = setTimeout(() => {
      if (!hasEndedRef.current) {
        player.play();
      }
    }, 50);

    // Only show the manual tap-to-play overlay if autoplay genuinely did not start.
    const fallbackTimer = setTimeout(() => {
      setShowPlayFallback(true);
    }, 650);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(fallbackTimer);
      if (endTimerRef.current) {
        clearTimeout(endTimerRef.current);
      }
    };
  }, [player]);

  useEventListener(player, 'statusChange', ({ status }) => {
    if (status === 'readyToPlay' && !hasEndedRef.current) {
      player.play();
    }
  });

  useEventListener(player, 'playingChange', (payload) => {
    setIsPlaying(payload.isPlaying);
  });

  useEventListener(player, 'playToEnd', () => {
    hasEndedRef.current = true;
    setHasEnded(true);
    if (endTimerRef.current) {
      clearTimeout(endTimerRef.current);
    }
    endTimerRef.current = setTimeout(() => {
      onFinished();
    }, 2000);
  });

  const handleTapPlay = () => {
    player.muted = false;
    player.play();
  };

  return (
    <View style={styles.fullscreenBackdrop}>
      <View style={styles.fullscreenVideoStage}>
        <VideoView
          player={player}
          style={styles.video}
          nativeControls={false}
          playsInline
          contentFit={isPortraitViewport ? 'cover' : 'contain'}
        />

        <View style={[styles.videoTopOverlay, { top: Math.max(insets.top, 12) + 8 }]}>
          <View style={styles.kickerPill}>
            <Text style={styles.kicker}>
              Tier {fromTier} → Tier {toTier} Evolution
            </Text>
          </View>
          <Pressable
            onPress={onSkip}
            style={styles.skipBtn}
            hitSlop={8}
            accessibilityRole="button">
            <Text style={styles.skipBtnText}>Skip</Text>
            <Feather name="chevron-right" size={14} color={Colors.textPrimary} />
          </Pressable>
        </View>

        {showPlayFallback && !isPlaying && !hasEnded ? (
          <Pressable
            onPress={handleTapPlay}
            style={styles.playOverlay}
            accessibilityRole="button"
            accessibilityLabel="Play transformation video">
            <View style={styles.playCircle}>
              <Feather name="play" size={32} color={Colors.textPrimary} />
            </View>
            <Text style={styles.playHintText}>Tap to Transform!</Text>
          </Pressable>
        ) : null}

        {showWatchLater ? (
          <View style={[styles.videoBottomOverlay, { bottom: Math.max(insets.bottom, 16) + 12 }]}>
            <Pressable onPress={onWatchLater} style={styles.laterPill} accessibilityRole="button">
              <Text style={styles.laterBtnText}>Watch later</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}

interface EvolutionContentProps {
  ceremony: EvolutionCeremonySpec;
  onClose: () => void;
  onClaim?: (userId: string, toTier: number) => Promise<void>;
}

function EvolutionContent({ ceremony, onClose, onClaim }: EvolutionContentProps) {
  const { user, fromTier, toTier, mode } = ceremony;
  const videoSource = resolveEvolutionVideo(user.avatarKey, fromTier, toTier);
  const [phase, setPhase] = useState<'video' | 'reveal'>(videoSource ? 'video' : 'reveal');
  const [videoKey, setVideoKey] = useState(0);
  const [claiming, setClaiming] = useState(false);

  const rank = getRankInfo(user.careerXp);

  const handleClaim = async () => {
    if (mode !== 'claim' || !onClaim) {
      onClose();
      return;
    }
    setClaiming(true);
    try {
      await onClaim(user.id, toTier);
      onClose();
    } finally {
      setClaiming(false);
    }
  };

  const handleReplay = () => {
    setVideoKey((k) => k + 1);
    setPhase('video');
  };

  if (phase === 'video' && videoSource) {
    return (
      <EvolutionVideoStage
        key={videoKey}
        source={videoSource}
        fromTier={fromTier}
        toTier={toTier}
        showWatchLater={mode === 'claim'}
        onSkip={() => setPhase('reveal')}
        onWatchLater={onClose}
        onFinished={() => setPhase('reveal')}
      />
    );
  }

  return (
    <View style={styles.revealBackdrop}>
      <View style={styles.card}>
        <View style={styles.topBar}>
          <Text style={styles.kicker}>Tier {toTier} Unlocked!</Text>
        </View>

        <View style={styles.revealStage}>
          <CharacterAvatar
            name={user.name}
            avatarKey={user.avatarKey}
            avatarUrl={user.avatarUrl}
            xpTotal={user.careerXp}
            tierOverride={toTier}
            size="xl"
            variant="hero"
            highlighted
            showTierBadge
          />
          <Text style={styles.title}>{user.name} Evolved!</Text>
          <Text style={styles.rankHighlight}>
            Tier {toTier} • {rank.title}
          </Text>
          <Text style={styles.subtitle}>
            {mode === 'claim'
              ? 'Your new gear is ready to equip across every Fort!'
              : 'Look how far your hero has come!'}
          </Text>
        </View>

        <View style={styles.actionsRow}>
          {videoSource ? (
            <PrimaryButton
              label="Replay"
              variant="secondary"
              disabled={claiming}
              onPress={handleReplay}
            />
          ) : null}
          <PrimaryButton
            label={
              mode === 'claim'
                ? claiming
                  ? 'Equipping...'
                  : `Equip Tier ${toTier}!`
                : 'Done'
            }
            variant="primary"
            disabled={claiming}
            onPress={() => {
              void handleClaim();
            }}
          />
        </View>
      </View>
    </View>
  );
}

export function EvolutionModal({ ceremony, onClose, onClaim }: EvolutionModalProps) {
  return (
    <Modal
      visible={Boolean(ceremony)}
      transparent
      statusBarTranslucent
      animationType="fade"
      onRequestClose={onClose}>
      {ceremony ? (
        <EvolutionContent
          key={`${ceremony.user.id}-${ceremony.fromTier}-${ceremony.toTier}-${ceremony.mode}`}
          ceremony={ceremony}
          onClose={onClose}
          onClaim={onClaim}
        />
      ) : null}
    </Modal>
  );
}
