import { ImageResponse } from 'next/og';

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          fontSize: 14, // Adjusted to fit "SBM"
          background: 'linear-gradient(to bottom right, #10b981, #0f766e)', // Emerald to Teal
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '20%', // Rounded square
          fontWeight: 800,
        }}
      >
        SBM
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    }
  );
}