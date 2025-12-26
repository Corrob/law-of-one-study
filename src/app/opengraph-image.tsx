import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Law of One Study Companion - AI-powered Ra Material explorer'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0e27',
          backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(77, 71, 195, 0.15) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(212, 168, 83, 0.1) 0%, transparent 50%)',
        }}
      >
        {/* Eye/Spiral Icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 40,
          }}
        >
          <svg
            width="120"
            height="120"
            viewBox="0 0 100 100"
            fill="none"
            stroke="#d4a853"
            strokeWidth="3"
          >
            {/* Spiral representing unity/infinity */}
            <path
              d="M50 20 C70 20, 80 35, 80 50 C80 65, 65 75, 50 75 C35 75, 25 62, 25 50 C25 38, 35 30, 50 30 C60 30, 68 40, 68 50 C68 60, 58 67, 50 67 C42 67, 35 58, 35 50 C35 42, 43 37, 50 37"
              strokeLinecap="round"
            />
            {/* Central point */}
            <circle cx="50" cy="50" r="4" fill="#d4a853" stroke="none" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            fontSize: 64,
            fontWeight: 600,
            color: '#e8e5f0',
            textAlign: 'center',
            marginBottom: 20,
            letterSpacing: '-0.02em',
          }}
        >
          Law of One Study Companion
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: 'flex',
            fontSize: 32,
            color: '#d4a853',
            textAlign: 'center',
            marginBottom: 10,
            fontStyle: 'italic',
          }}
        >
          AI-Powered Ra Material Explorer
        </div>

        {/* Description */}
        <div
          style={{
            display: 'flex',
            fontSize: 24,
            color: '#9d98b8',
            textAlign: 'center',
            maxWidth: 900,
          }}
        >
          Search 1,500+ Q&A pairs from 106 sessions • Free & Open Source
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
