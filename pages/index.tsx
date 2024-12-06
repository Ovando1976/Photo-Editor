import dynamic from 'next/dynamic';

const FabricCanvas = dynamic(() => import('../components/Canvas'), {
  ssr: false,
});

export default function Home() {
  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Photoshop-Like Editor</h1>
      <FabricCanvas />
    </div>
  );
}