// src/components/common/Lanyard.jsx
import React, { useEffect, useRef, useState, Suspense } from 'react';
import { Canvas, extend, useFrame } from '@react-three/fiber';
import { useGLTF, useTexture, Environment, Lightformer } from '@react-three/drei';
import { BallCollider, CuboidCollider, Physics, RigidBody, useRopeJoint, useSphericalJoint } from '@react-three/rapier';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';

// Asset paths (relative to the public folder)
const CARD_GLB_PATH = '/assets/lanyard/card.glb';
const LANYARD_TEXTURE_PATH = '/assets/lanyard/lanyard.png';

import * as THREE from 'three';
import './Lanyard.css';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

extend({ MeshLineGeometry, MeshLineMaterial });

// Helper component to load GLTF, wrapped in a try-catch for safety
const GLTFCardLoader = () => {
  try {
    const gltf = useGLTF(CARD_GLB_PATH);
    // Preload textures if they are part of the GLTF and useGLTF supports it
    // Or ensure materials are correctly set up if they rely on external textures not handled by useTexture separately
    // useGLTF.preload(CARD_GLB_PATH); // Optional: if you want to preload
    return gltf;
  } catch (e) {
    console.error(`Failed to load GLTF from ${CARD_GLB_PATH}:`, e);
    return { nodes: {}, materials: {} }; // Return a default/empty structure on error
  }
};

// Helper component to load Texture
const LanyardTextureLoader = () => {
  try {
    const texture = useTexture(LANYARD_TEXTURE_PATH);
    // useTexture.preload(LANYARD_TEXTURE_PATH); // Optional
    return texture;
  } catch (e) {
    console.error(`Failed to load texture from ${LANYARD_TEXTURE_PATH}:`, e);
    const placeholder = new THREE.DataTexture(new Uint8Array([200, 200, 200, 255]), 1, 1, THREE.RGBAFormat); // Grey placeholder
    placeholder.needsUpdate = true;
    return placeholder;
  }
};


export default function LanyardCanvas({ 
  position = [0, 0, 30], 
  gravity = [0, -40, 0], 
  fov = 20, 
  transparent = true,
  onPulledNavigateTo
}) {
  return (
    <div className="lanyard-wrapper">
      <Canvas
        camera={{ position: position, fov: fov }}
        gl={{ alpha: transparent, antialias: true }}
        onCreated={({ gl }) => gl.setClearColor(new THREE.Color(0x000000), transparent ? 0 : 1)}
      >
        <ambientLight intensity={Math.PI * 0.5} />
        <Physics gravity={gravity} timeStep={1 / 60}>
          <Suspense fallback={null}> 
            <Band onPulledNavigateTo={onPulledNavigateTo} />
          </Suspense>
        </Physics>
        <Environment blur={0.75}>
          <Lightformer intensity={2} color="white" position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={3} color="white" position={[-1, -1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={3} color="white" position={[1, 1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={10} color="white" position={[-10, 0, 14]} rotation={[0, Math.PI / 2, Math.PI / 3]} scale={[100, 10, 1]} />
        </Environment>
      </Canvas>
    </div>
  );
}

function Band({ maxSpeed = 50, minSpeed = 10, onPulledNavigateTo }) {
  const band = useRef();
  const fixed = useRef();
  const j1 = useRef();
  const j2 = useRef();
  const j3 = useRef();
  const card = useRef();

  const vec = new THREE.Vector3();
  const ang = new THREE.Vector3();
  const rot = new THREE.Vector3();
  // const dir = new THREE.Vector3(); // dir was not used in the latest useFrame

  const segmentProps = { type: 'dynamic', canSleep: true, colliders: false, angularDamping: 2, linearDamping: 2 };

  // Use the loader components
  const { nodes, materials } = GLTFCardLoader(); 
  const texture = LanyardTextureLoader(); 

  const [curve] = useState(() => new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]));
  
  const [dragged, setDragged] = useState(null);
  const [isDraggingDown, setIsDraggingDown] = useState(false);
  const dragStartY = useRef(0);
  const PULL_THRESHOLD = -2; 

  const navigate = useNavigate();
  const params = useParams();
  const { i18n } = useTranslation();
  const currentLang = params.lang || i18n.language || 'vi';

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
  useSphericalJoint(j3, card, [[0, 0, 0], [0, 1.50, 0]]);

  useEffect(() => {
    if (dragged) {
      document.body.style.cursor = 'grabbing';
      return () => void (document.body.style.cursor = 'auto');
    } else if (document.body.style.cursor !== 'auto' && !dragged) {
        document.body.style.cursor = 'auto';
    }
  }, [dragged]);

  useFrame((state, delta) => {
    if (dragged && card.current) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      const targetX = vec.x - dragged.x;
      const targetY = vec.y - dragged.y;
      const targetZ = card.current.translation().z; 

      card.current.setNextKinematicTranslation({ x: targetX, y: targetY, z: targetZ });
      [j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp());

      if (isDraggingDown) {
        const currentCardY = card.current.translation().y;
        const deltaY = currentCardY - dragStartY.current;
        if (deltaY < PULL_THRESHOLD && onPulledNavigateTo) {
            const navigateToPath = `/${currentLang}/${onPulledNavigateTo.startsWith('/') ? onPulledNavigateTo.substring(1) : onPulledNavigateTo}`.replace(/\/+/g, '/');
            navigate(navigateToPath);
            setDragged(null); 
            setIsDraggingDown(false);
        }
      }
    }

    if (fixed.current && j1.current && j2.current && j3.current && band.current) {
      [j1, j2].forEach((ref) => {
        if (!ref.current.lerped) ref.current.lerped = new THREE.Vector3().copy(ref.current.translation());
        const clampedDistance = Math.max(0.1, Math.min(1, ref.current.lerped.distanceTo(ref.current.translation())));
        ref.current.lerped.lerp(ref.current.translation(), delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed)));
      });
      curve.points[0].copy(j3.current.translation());
      curve.points[1].copy(j2.current.lerped);
      curve.points[2].copy(j1.current.lerped);
      curve.points[3].copy(fixed.current.translation());
      band.current.geometry.setPoints(curve.getPoints(32));
      
      if (card.current) { 
        ang.copy(card.current.angvel());
        rot.copy(card.current.rotation());
        card.current.setAngvel({ x: ang.x * 0.8, y: ang.y - rot.y * 0.25, z: ang.z * 0.8 });
      }
    }
  });

  curve.curveType = 'catmullrom'; 
  if (texture && !(texture instanceof THREE.DataTexture)) { // Check if texture is not the placeholder
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  }


  const handlePointerDown = (e) => {
    if (!card.current) return; // Ensure card ref is available
    e.target.setPointerCapture(e.pointerId);
    const cardPos = card.current.translation();
    const initialOffset = new THREE.Vector3().copy(e.point).sub(cardPos);
    setDragged(initialOffset);
    dragStartY.current = cardPos.y;
    setIsDraggingDown(true);
    document.body.style.cursor = 'grabbing';
  };

  const handlePointerUp = (e) => {
    e.target.releasePointerCapture(e.pointerId);
    setDragged(null);
    setIsDraggingDown(false);
    document.body.style.cursor = 'auto'; 
  };
  
   const handlePointerOver = () => {if(!dragged) document.body.style.cursor = 'grab'};
   const handlePointerOut = () => { if (!dragged) document.body.style.cursor = 'auto'; };

  // Ensure nodes and materials are available before rendering meshes
  const cardNode = nodes && nodes.card ? nodes.card : null;
  const baseMaterial = materials && materials.base ? materials.base : null;
  const clipNode = nodes && nodes.clip ? nodes.clip : null;
  const clampNode = nodes && nodes.clamp ? nodes.clamp : null;
  const metalMaterial = materials && materials.metal ? materials.metal : null;

  return (
    <>
      <group position={[0, 4, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.05]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.05]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.05]} />
        </RigidBody>
        <RigidBody 
            position={[2, 0, 0]} 
            ref={card} 
            {...segmentProps} 
            type={dragged ? 'kinematicPosition' : 'dynamic'}
            enabledRotations={[false, false, true]}
        >
          <CuboidCollider args={[0.8, 1.125, 0.08]} />
          {cardNode && baseMaterial && ( 
            <group
                scale={2.25}
                position={[0, -1.2, 0]} 
                onPointerOver={handlePointerOver}
                onPointerOut={handlePointerOut}
                onPointerUp={handlePointerUp}
                onPointerDown={handlePointerDown}
            >
                <mesh geometry={cardNode.geometry}>
                <meshPhysicalMaterial 
                    map={baseMaterial.map} 
                    map-anisotropy={16} 
                    clearcoat={0.8} 
                    clearcoatRoughness={0.1} 
                    roughness={0.6} 
                    metalness={0.5} 
                />
                </mesh>
                {clipNode && metalMaterial && <mesh geometry={clipNode.geometry} material={metalMaterial} material-roughness={0.3} />}
                {clampNode && metalMaterial && <mesh geometry={clampNode.geometry} material={metalMaterial} />}
            </group>
          )}
        </RigidBody>
      </group>
      {texture && ( // Ensure texture is loaded before rendering the band
        <mesh ref={band}>
            <meshLineGeometry />
            <meshLineMaterial
            color="white"
            depthTest={false}
            resolution={[window.innerWidth, window.innerHeight]}
            useMap
            map={texture}
            repeat={[-3, 1]} 
            lineWidth={0.5}  
            transparent 
            opacity={0.9}  
            />
        </mesh>
      )}
    </>
  );
}