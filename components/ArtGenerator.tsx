import dynamic from 'next/dynamic';

const FabricCanvas = dynamic(() => import('./Canvas'), {
  ssr: false,
});

const ArtGenerator: React.FC = () => {
  return (
    <div>
      <h1>Art Generator</h1>
      <FabricCanvas />
    </div>
  );
};

export default ArtGenerator;