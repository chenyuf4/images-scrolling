import { Canvas } from "@react-three/fiber";
import "./App.scss";
import { Suspense } from "react";
import { PerspectiveCamera } from "@react-three/drei";
import Scene from "features/Scene/Scene";
import { useRef } from "react";
import Home from "features/Home/Home";
const App = () => {
  const scrollPosRef = useRef({
    current: 0,
    target: 0
  });

  const canvasSizeRef = useRef({
    width: 0,
    height: 0
  });

  return (
    <>
      {/* <Home /> */}
      <Canvas
        frameloop="demand"
        dpr={Math.max(window.devicePixelRatio, 2)}
        linear={true}
        flat={true}
        gl={{ antialias: true, alpha: true }}
        onCreated={(state) => {
          const { viewport } = state;
          const { width, height } = viewport;
          canvasSizeRef.current.width = width;
          canvasSizeRef.current.height = height;
        }}
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
    </>
  );
};

export default App;
