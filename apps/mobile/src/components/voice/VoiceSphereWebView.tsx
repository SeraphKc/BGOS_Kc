import React, { useRef, useEffect, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface VoiceSphereWebViewProps {
  isActive: boolean;
  mode: 'idle' | 'listening' | 'speaking' | 'thinking';
  audioLevel: number; // 0-1 (VAD score)
}

// Convert mode to shader mode number
const modeToNumber = {
  idle: 0,
  listening: 1,
  speaking: 2,
  thinking: 2,
};

export const VoiceSphereWebView: React.FC<VoiceSphereWebViewProps> = ({
  isActive,
  mode,
  audioLevel,
}) => {
  const webViewRef = useRef<WebView>(null);

  // Send state updates to WebView
  useEffect(() => {
    if (webViewRef.current) {
      const modeNum = isActive ? modeToNumber[mode] : 0;
      const frequency = isActive ? audioLevel * 1.5 : 0;

      webViewRef.current.injectJavaScript(`
        if (window.updateVisualization) {
          window.updateVisualization(${modeNum}, ${frequency});
        }
        true;
      `);
    }
  }, [isActive, mode, audioLevel]);

  return (
    <View style={styles.container} pointerEvents="none">
      <WebView
        ref={webViewRef}
        source={{ html: THREEJS_HTML }}
        style={styles.webview}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        javaScriptEnabled={true}
        domStorageEnabled={true}
        originWhitelist={['*']}
        // Disable all media features to prevent audio focus conflicts
        mediaPlaybackRequiresUserAction={true}
        allowsInlineMediaPlayback={false}
        // Performance optimizations
        cacheEnabled={false}
        incognito={true}
        onError={(e) => console.error('WebView error:', e.nativeEvent)}
      />
    </View>
  );
};

// Three.js visualization HTML - ported from web reference
const THREEJS_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: rgb(38, 38, 36);
    }
    canvas {
      display: block;
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script>
    // State variables
    let currentMode = 0;
    let targetMode = 0;
    let currentFrequency = 0;
    let targetFrequency = 0;
    let currentBloom = 0.2;
    let targetBloom = 0.2;

    // Expose update function to React Native
    window.updateVisualization = function(mode, frequency) {
      targetMode = mode;
      targetFrequency = frequency;

      // Update bloom based on mode
      if (mode === 0) targetBloom = 0.2;
      else if (mode === 1) targetBloom = 0.4;
      else targetBloom = 0.3;
    };

    // Setup Three.js
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x262624);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffd700, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffd700, 2.0);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const backLight = new THREE.PointLight(0xffd700, 1.0);
    backLight.position.set(-5, -5, -5);
    scene.add(backLight);

    // Vertex shader with Perlin noise
    const vertexShader = \`
      uniform float u_time;
      uniform float u_frequency;
      uniform float u_mode;

      varying vec3 vNormal;
      varying vec3 vPosition;
      varying float vDisplacement;

      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+10.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
      vec3 fade(vec3 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }

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
        vec4 norm0 = taylorInvSqrt(vec4(dot(g000,g000), dot(g010,g010), dot(g100,g100), dot(g110,g110)));
        g000 *= norm0.x; g010 *= norm0.y; g100 *= norm0.z; g110 *= norm0.w;
        vec4 norm1 = taylorInvSqrt(vec4(dot(g001,g001), dot(g011,g011), dot(g101,g101), dot(g111,g111)));
        g001 *= norm1.x; g011 *= norm1.y; g101 *= norm1.z; g111 *= norm1.w;
        float n000 = dot(g000, Pf0);
        float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
        float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
        float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
        float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
        float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
        float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
        float n111 = dot(g111, Pf1);
        vec3 fade_xyz = fade(Pf0);
        vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
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
          displacement = noise * 0.08;
        } else if (u_mode == 1.0) {
          displacement = noise * u_frequency * 0.4;
        } else {
          displacement = noise * 0.15 + sin(u_time * 2.0) * 0.1;
        }

        vDisplacement = displacement;
        vec3 newPosition = position + normal * displacement;
        vPosition = newPosition;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
      }
    \`;

    // Fragment shader - Golden yellow (#FFD700)
    const fragmentShader = \`
      uniform float u_mode;
      uniform float u_time;
      uniform float u_frequency;

      varying vec3 vNormal;
      varying vec3 vPosition;
      varying float vDisplacement;

      void main() {
        // Pure golden yellow color #FFD700 = RGB(1.0, 0.843, 0.0)
        vec3 baseColor = vec3(1.0, 0.843, 0.0);
        vec3 color;

        // Breathing effect for idle/listening
        float breath = (sin(u_time * 1.5) + 1.0) * 0.5; // 0 to 1

        if (u_mode < 1.5) {
          // Mode 0 (idle) or Mode 1 (listening) - no bloom, just breathing yellow
          // Base brightness with gentle breathing
          float baseBrightness = 0.4 + breath * 0.15;

          if (u_mode > 0.5) {
            // Listening mode - react to voice (frequency/displacement)
            baseBrightness += abs(vDisplacement) * 0.8 + u_frequency * 0.3;
          }

          color = baseColor * baseBrightness;
        } else {
          // Mode 2 (speaking/thinking) - WITH bloom effect
          float pulse = (sin(u_time * 3.0) + 1.0) * 0.5;
          float bloom = 1.2 + pulse * 0.6; // Brighter with pulsing bloom
          color = baseColor * bloom;
        }

        gl_FragColor = vec4(color, 1.0);
      }
    \`;

    // Create sphere with shader material
    const geometry = new THREE.IcosahedronGeometry(1.5, 32);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        u_time: { value: 0 },
        u_frequency: { value: 0 },
        u_mode: { value: 0 }
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      wireframe: true,
      transparent: true,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);

      // Update time
      material.uniforms.u_time.value += 0.05;

      // Smooth transitions (lerp)
      currentMode += (targetMode - currentMode) * 0.1;
      currentFrequency += (targetFrequency - currentFrequency) * 0.1;

      material.uniforms.u_mode.value = currentMode;
      material.uniforms.u_frequency.value = currentFrequency;

      // Rotate mesh
      mesh.rotation.x += 0.005;
      mesh.rotation.y += 0.005;

      renderer.render(scene, camera);
    }

    // Handle resize
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Start animation
    animate();
  </script>
</body>
</html>
`;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(38, 38, 36)',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
