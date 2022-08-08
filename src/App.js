import { Canvas } from "@react-three/fiber";
import "./App.scss";
import { Suspense } from "react";
import { PerspectiveCamera } from "@react-three/drei";
import Scene from "features/Scene/Scene";
import { useRef } from "react";
import Home from "features/Home/Home";
import { useMediaQuery } from "react-responsive";
import MobilePage from "features/MobilePage/MobilePage";
const App = () => {
  const scrollPosRef = useRef({
    current: 0,
    target: 0,
  });

  const isBigScreen = useMediaQuery({ query: "(min-width: 1224px)" });
  const isLandscape = useMediaQuery({ query: "(orientation: landscape)" });
  return (
    <>
      <Home />
      {isBigScreen && isLandscape ? (
        <Canvas
          dpr={Math.max(window.devicePixelRatio, 2)}
          linear={true}
          flat={true}
          legacy={true}
          gl={{ antialias: true, alpha: true }}
        >
          <Suspense fallback={null}>
            <PerspectiveCamera
              makeDefault
              position={[0, 0, 5]}
              near={0.1}
              far={100}
              fov={75}
            />
            <color attach="background" args={["#141414"]} />
            <Scene scrollPosRef={scrollPosRef} />
          </Suspense>
        </Canvas>
      ) : (
        <MobilePage />
      )}
    </>
  );
};

export default App;
