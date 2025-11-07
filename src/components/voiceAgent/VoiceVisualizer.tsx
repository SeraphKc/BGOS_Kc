import React, { useEffect, useRef, useMemo, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { motion } from 'framer-motion';

interface VoiceVisualizerProps {
    isActive: boolean;
    isThinking: boolean;
    audioStream?: MediaStream;
    style?: React.CSSProperties;
}

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({
    isActive,
    isThinking,
    audioStream,
    style
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const meshRef = useRef<THREE.Mesh | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | undefined>(undefined);
    const audioContextRef = useRef<AudioContext | null>(null);
    const composerRef = useRef<EffectComposer | null>(null);
    const bloomPassRef = useRef<UnrealBloomPass | null>(null);
    const currentBloomRef = useRef<number>(0.2);
    const targetBloomRef = useRef<number>(0.2);
    const lastModeRef = useRef<number>(0);
    const [webglError, setWebglError] = useState<boolean>(false);


    const shaderCode = useMemo(() => ({
        vertex: `
      uniform float u_time;
      uniform float u_frequency;
      uniform float u_mode;
      
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying float vDisplacement;
      
      vec3 mod289(vec3 x) {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
      }
      vec4 mod289(vec4 x) {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
      }
      vec4 permute(vec4 x) {
        return mod289(((x*34.0)+10.0)*x);
      }
      vec4 taylorInvSqrt(vec4 r) {
        return 1.79284291400159 - 0.85373472095314 * r;
      }
      vec3 fade(vec3 t) {
        return t*t*t*(t*(t*6.0-15.0)+10.0);
      }
      float pnoise(vec3 P, vec3 rep) {
        vec3 Pi0 = mod(floor(P), rep);
        vec3 Pi1 = mod(Pi0 + vec3(1.0), rep);
        Pi0 = mod289(Pi0);
        Pi1 = mod289(Pi1);
        vec3 Pf0 = fract(P);
        vec3 Pf1 = Pf0 - vec3(1.0);
        vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
        vec4 iy = vec4(Pi0.yy, Pi1.yy);
        vec4 iz0 = Pi0.zzzz;
        vec4 iz1 = Pi1.zzzz;
        vec4 ixy = permute(permute(ix) + iy);
        vec4 ixy0 = permute(ixy + iz0);
        vec4 ixy1 = permute(ixy + iz1);
        vec4 gx0 = ixy0 * (1.0 / 7.0);
        vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
        gx0 = fract(gx0);
        vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
        vec4 sz0 = step(gz0, vec4(0.0));
        gx0 -= sz0 * (step(0.0, gx0) - 0.5);
        gy0 -= sz0 * (step(0.0, gy0) - 0.5);
        vec4 gx1 = ixy1 * (1.0 / 7.0);
        vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
        gx1 = fract(gx1);
        vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
        vec4 sz1 = step(gz1, vec4(0.0));
        gx1 -= sz1 * (step(0.0, gx1) - 0.5);
        gy1 -= sz1 * (step(0.0, gy1) - 0.5);
        vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
        vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
        vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
        vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
        vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
        vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
        vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
        vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
        vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010),
                                       dot(g100, g100), dot(g110, g110)));
        g000 *= norm0.x;
        g010 *= norm0.y;
        g100 *= norm0.z;
        g110 *= norm0.w;
        vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011),
                                       dot(g101, g101), dot(g111, g111)));
        g001 *= norm1.x;
        g011 *= norm1.y;
        g101 *= norm1.z;
        g111 *= norm1.w;
        float n000 = dot(g000, Pf0);
        float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
        float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
        float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
        float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
        float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
        float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
        float n111 = dot(g111, Pf1);
        vec3 fade_xyz = fade(Pf0);
        vec4 n_z = mix(vec4(n000, n100, n010, n110),
                      vec4(n001, n101, n011, n111), fade_xyz.z);
        vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
        float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
        return 2.2 * n_xyz;
      }
      
      void main() {
        vNormal = normal;
        
        vec3 noisePos = position * 3.0 + u_time * 0.5;
        float displacement = 0.0;
        float noise = pnoise(noisePos, vec3(10.0));
        
        if (u_mode == 0.0) {
          // Idle: subtle movement
          displacement = noise * 0.08;
        } else if (u_mode == 1.0) {
          // User talking: react to frequency
          displacement = noise * u_frequency * 0.4;
        } else {
          // AI replying: pulsing effect
          displacement = noise * 0.15 + sin(u_time * 2.0) * 0.1;
        }
        
        vDisplacement = displacement;
        vec3 newPosition = position + normal * displacement;
        vPosition = newPosition;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
      }
    `,
        fragment: `
      uniform float u_mode;
      uniform float u_time;
      uniform float u_red;
      uniform float u_green;
      uniform float u_blue;
      uniform float u_intensity;
      
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying float vDisplacement;
      
      void main() {
        vec3 color;
if (u_mode == 0.0) {
    color = vec3(u_red, u_green, u_blue) * 0.3 * u_intensity; // Reduced from 0.6
} else if (u_mode == 1.0) {
    color = vec3(u_red, u_green, u_blue) * (0.5 + abs(vDisplacement)) * u_intensity; // Reduced from 0.7
} else {
    float pulse = (sin(u_time * 2.0) + 1.0) * 0.5;
    color = vec3(u_red, u_green, u_blue) * (1.0 + pulse * 0.5) * u_intensity;
}
        
        // Add fresnel effect
        vec3 viewDirection = normalize(-vPosition);
        float fresnel = pow(1.0 + dot(viewDirection, vNormal), 2.0);
        // color *= fresnel;
        
        gl_FragColor = vec4(color, 1.0);
      }
    `
    }), []);

    useEffect(() => {
        console.log('VoiceVisualizer useEffect triggered');
        if (!containerRef.current) {
            console.log('Container ref is null');
            return;
        }

        // Setup Three.js
        const container = containerRef.current;
        console.log('Container dimensions:', container.clientWidth, 'x', container.clientHeight);
        
        // Ensure container has valid dimensions
        if (container.clientWidth === 0 || container.clientHeight === 0) {
            console.warn('Container has zero dimensions, waiting for resize...');
            return;
        }

        const renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true,
            powerPreference: "high-performance",
            failIfMajorPerformanceCaveat: false
        });
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setClearColor(0x000000, 0);

        // Check if WebGL is supported
        if (!renderer.capabilities.isWebGL) {
            console.warn('Three.js WebGL not detected, but proceeding with manual check...');
            // Try to create a basic WebGL context manually
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) {
                console.error('WebGL is not available in this environment');
                setWebglError(true);
                return;
            }
            // If we get here, WebGL is available, but Three.js might have issues
            console.log('WebGL context available, proceeding with Three.js...');
        }
        const scene = new THREE.Scene();
        scene.background = null; // Make background transparent
        const camera = new THREE.PerspectiveCamera(
            75,
            container.clientWidth / container.clientHeight,
            0.1,
            1000
        );

        // Enhanced lighting setup
        const ambientLight = new THREE.AmbientLight(0xffd700, 0.5);
        scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffd700, 2.0);
        pointLight.position.set(5, 5, 5);
        scene.add(pointLight);

        const backLight = new THREE.PointLight(0xffd700, 1.0);
        backLight.position.set(-5, -5, -5);
        scene.add(backLight);

        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);

        camera.position.z = 5;

        const geometry = new THREE.IcosahedronGeometry(1.5, 32);
        const material = new THREE.ShaderMaterial({
            uniforms: {
                u_time: { value: 0 },
                u_frequency: { value: 0 },
                u_mode: { value: 0 },
                u_red: { value: 0.8 },
                u_green: { value: 0.84 }, // Adjusted for our yellow color
                u_blue: { value: 0.0 },
                u_intensity: { value: 2.0 }
            },
            vertexShader: shaderCode.vertex,
            fragmentShader: shaderCode.fragment,
            wireframe: true,
            transparent: true,
            side: THREE.DoubleSide,
            toneMapped: false
        });

        // Setup post-processing
        const renderScene = new RenderPass(scene, camera);

        const composer = new EffectComposer(renderer);
        composer.addPass(renderScene);

        composer.outputColorSpace = THREE.SRGBColorSpace;
        composer.setSize(container.clientWidth, container.clientHeight);
        composerRef.current = composer;

        // Set fixed values for visualization
        material.uniforms.u_red.value = 1.0;    // Ярко-красный
        material.uniforms.u_green.value = 0.95; // Ярко-зелёный для насыщенного жёлтого
        material.uniforms.u_blue.value = 0.0;   // Без синего
        material.uniforms.u_intensity.value = 2.5; // Высокая яркость
        material.wireframe = true;

        // Set fixed bloom values
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        // Store refs
        rendererRef.current = renderer;
        sceneRef.current = scene;
        cameraRef.current = camera;
        meshRef.current = mesh;

        // Setup audio analyzer if stream is provided
        if (audioStream && isActive) {
            console.log('Setting up audio analyzer...');
            if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                try {
                    const audioContext = new AudioContext();
                    const analyser = audioContext.createAnalyser();
                    const source = audioContext.createMediaStreamSource(audioStream);

                    analyser.fftSize = 256;
                    source.connect(analyser);

                    analyserRef.current = analyser;
                    audioContextRef.current = audioContext;
                    console.log('Audio analyzer setup complete');
                } catch (err) {
                    console.warn('Failed to create AudioContext:', err);
                }
            }
        }

        // Animation loop
        const animate = () => {
            if (!mesh || !material.uniforms) return;

            material.uniforms.u_time.value += 0.05;

            // Smooth bloom transition
            const bloomLerpFactor = 0.05; // Adjust this value to control transition speed (0.01 to 0.1)
            currentBloomRef.current += (targetBloomRef.current - currentBloomRef.current) * bloomLerpFactor;

            // Smooth mode transition
            const modeLerpFactor = 0.1; // Adjust this value to control transition speed (0.05 to 0.2)
            material.uniforms.u_mode.value += (lastModeRef.current - material.uniforms.u_mode.value) * modeLerpFactor;

            if (analyserRef.current && isActive && !isThinking && audioContextRef.current?.state === 'running') {
                const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
                analyserRef.current.getByteFrequencyData(dataArray);

                // Calculate average frequency
                const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                material.uniforms.u_frequency.value = (average / 128.0) * 1.8; // Slightly reduced multiplier
                lastModeRef.current = 1.0;
                targetBloomRef.current = 0.4;
            } else if (isThinking) {
                lastModeRef.current = 2.0;
                targetBloomRef.current = 0.3;
            } else {
                lastModeRef.current = 0.0;
                targetBloomRef.current = 0.2;
                material.uniforms.u_frequency.value = 0.0;
            }

            if (bloomPassRef.current) {
                bloomPassRef.current.strength = currentBloomRef.current;
            }

            mesh.rotation.x += 0.005;
            mesh.rotation.y += 0.005;

            composer.render();
            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animate();

        // Cleanup
        return () => {
            console.log('Cleaning up VoiceVisualizer...');
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                try {
                    audioContextRef.current.close();
                } catch (err) {
                    console.warn('AudioContext already closed:', err);
                }
            }
            if (renderer.domElement.parentElement) {
                renderer.domElement.parentElement.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, [isActive, isThinking, audioStream, shaderCode]);

    // Handle window resize and initial setup
    useEffect(() => {
        const handleResize = () => {
            if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;

            const container = containerRef.current;
            const renderer = rendererRef.current;
            const camera = cameraRef.current;

            // Only update if container has valid dimensions
            if (container.clientWidth > 0 && container.clientHeight > 0) {
                camera.aspect = container.clientWidth / container.clientHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(container.clientWidth, container.clientHeight);
                // if (composerRef.current) {
                //     composerRef.current.setSize(container.clientWidth, container.clientHeight);
                // }
            }
        };

        // Initial setup if container is ready
        if (containerRef.current && containerRef.current.clientWidth > 0 && containerRef.current.clientHeight > 0) {
            handleResize();
        }

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fallback component if WebGL is not supported
    if (webglError) {
        console.log('Rendering WebGL fallback');
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'red',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10
                }}
            >
                <div style={{
                    textAlign: 'center',
                    color: '#ffe01b',
                    fontSize: '24px',
                    fontWeight: 'bold'
                }}>
                    <div style={{ marginBottom: '16px' }}>
                        {isActive ? '🎤' : isThinking ? '🤔' : '🎵'}
                    </div>
                    <div>
                        {isActive ? 'Voice Active' : isThinking ? 'Processing...' : 'Voice Agent'}
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            ref={containerRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                width: '100%',
                height: '100%',
                maxWidth: '100%',
                maxHeight: '100%',
                background: 'transparent',
                ...style
            }}
        />
    );
};