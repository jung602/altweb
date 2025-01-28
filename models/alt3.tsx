import { useGLTF } from "@react-three/drei";
import { useEffect } from "react";

export function Alt3(props: any) {
  const { scene } = useGLTF("/gltf/alt3.glb");

  useEffect(() => {
    scene.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  return <primitive object={scene} {...props} />;
} 