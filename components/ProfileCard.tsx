'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { LanyardData } from '@/types/lanyard';
import { getDiscordAvatarUrl, getAvatarDecorationUrl, getDiscordBannerUrl, getStatusColor, getStatusLabel } from '@/lib/lanyard';

export default function ProfileCard() {
  const [lanyard, setLanyard] = useState<LanyardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [visitors, setVisitors] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }));
    };

    updateTime();
    const timeInterval = setInterval(updateTime, 1000);
    return () => clearInterval(timeInterval);
  }, []);

  useEffect(() => {
    const fetchLanyard = async () => {
      try {
        const response = await fetch('/api/lanyard');
        if (!response.ok) throw new Error('Failed to fetch Lanyard data');
        const data = await response.json();
        setLanyard(data.data);
      } catch (err) {
        console.error('Lanyard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLanyard();
    const interval = setInterval(fetchLanyard, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchVisitors = async () => {
      try {
        const response = await fetch('/api/visitors');
        const data = await response.json();
        setVisitors(data.count);
      } catch (err) {
        console.error('Visitor count error:', err);
      }
    };

    fetchVisitors();
  }, []);

  const avatarUrl = lanyard
    ? getDiscordAvatarUrl(lanyard.discord_user.id, lanyard.discord_user.avatar, 256)
    : null;

  const decorationUrl = lanyard?.discord_user.avatar_decoration_data
    ? getAvatarDecorationUrl(lanyard.discord_user.avatar_decoration_data.asset)
    : null;

  const bannerUrl = lanyard?.discord_user.banner
    ? getDiscordBannerUrl(lanyard.discord_user.id, lanyard.discord_user.banner, 600)
    : '/banner.gif';

  const statusColor = lanyard ? getStatusColor(lanyard.discord_status) : '#80848e';
  const statusLabel = lanyard ? getStatusLabel(lanyard.discord_status) : 'Loading...';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="window active glass"
    >
      <div className="title-bar">
        <span className="title-bar-text">User Profile</span>
        <div className="title-bar-controls">
          <button aria-label="Minimize"></button>
          <button aria-label="Maximize"></button>
          <button aria-label="Close"></button>
        </div>
      </div>

      <div className="window-body !p-0">
        <div className="relative w-full h-24">
          <Image
            src={bannerUrl}
            alt="Profile Banner"
            fill
            className="object-cover"
            unoptimized
          />
        </div>

        <div className="p-4 relative" style={{ marginTop: '-2.5rem' }}>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="relative w-32 h-32 mb-4 -mt-6"
          >
            {loading ? (
              <div className="w-full h-full rounded-full bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 p-1">
                <div className="w-full h-full rounded-full bg-neutral-0 flex items-center justify-center text-6xl">
                </div>
              </div>
            ) : avatarUrl ? (
              <>
                <div className="w-full h-full rounded-full overflow-hidden relative">
                  <Image
                    src={avatarUrl}
                    alt="Discord Avatar"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                {decorationUrl && (
                  <div className="absolute inset-1 pointer-events-none">
                    <Image
                      src={decorationUrl}
                      alt="Avatar Decoration"
                      fill
                      className="object-contain scale-125"
                      unoptimized
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 p-1">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-6xl">
                </div>
              </div>
            )}
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 border-white shadow-md"
              style={{ backgroundColor: statusColor }}
              title={statusLabel}
            ></motion.div>
          </motion.div>

          <div className="absolute top-12 right-4 z-10 flex flex-col gap-1">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="px-2 py-1 bg-white/80 border border-gray-300 rounded flex items-center gap-1.5 shadow-sm"
            >
              <span className="text-xs font-semibold text-gray-700">
                {visitors.toLocaleString()} visits
              </span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="px-2 py-1 bg-white/80 border border-gray-300 rounded flex items-center gap-1.5 shadow-sm"
            >
              <span className="text-xs font-semibold text-gray-700">
                {currentTime}
              </span>
            </motion.div>
          </div>

          <h2 className="text-xl font-bold text-gray-800 mb-1">
            {lanyard?.discord_user.global_name || lanyard?.discord_user.username || ''}
          </h2>
          <p className="text-gray-500 text-sm mb-4">
            @{lanyard?.discord_user.username || ''}
          </p>

          <div className="flex gap-1 mt-4">
            <a href="https://github.com/Akryst" target="_blank" rel="noopener noreferrer">
              <button style={{ width: 24, height: 24, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 'unset' }} title="GitHub">
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </button>
            </a>
            <a href="https://x.com/Akryst_" target="_blank" rel="noopener noreferrer">
              <button style={{ width: 24, height: 24, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 'unset' }} title="X">
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </button>
            </a>
            <a href="https://osu.ppy.sh/users/akryst" target="_blank" rel="noopener noreferrer">
              <button style={{ width: 24, height: 24, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 'unset' }} title="osu!">
                <svg width="14" height="14" viewBox="0 0 128 128" fill="currentColor">
                  <path d="M64 0C28.7 0 0 28.7 0 64s28.7 64 64 64 64-28.7 64-64S99.3 0 64 0zm0 116c-28.7 0-52-23.3-52-52s23.3-52 52-52 52 23.3 52 52-23.3 52-52 52z"/>
                  <circle cx="64" cy="64" r="32"/>
                </svg>
              </button>
            </a>
            <a href="https://steamcommunity.com/id/Anti-kryst" target="_blank" rel="noopener noreferrer">
              <button style={{ width: 24, height: 24, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 'unset' }} title="Steam">
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z"/>
                </svg>
              </button>
            </a>
          </div>

          <div className="absolute bottom-0 right-0 pointer-events-none opacity-90" style={{ zIndex: 0 }}>
            <Image
              src="/monika.png"
              alt="Monika"
              width={200}
              height={260}
              className="object-contain"
              unoptimized
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}