import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Eye, RotateCcw, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

// Pre-allocated scratch math objects to ensure zero GC during animation loop
const _vec3 = new THREE.Vector3();

export const HeroThreeScene: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentPreset, setCurrentPreset] = useState<'study' | 'geometry' | 'zen'>('study');

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL guard
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xF8FAFC, 0.04);

    // Camera - perfectly framed for hero presentation
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(0, 0.5, 6.2);

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // Studio Environment map using PMREMGenerator & RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Studio 3-Point Lighting Rig
    const keyLight = new THREE.DirectionalLight(0xFFF6E8, 2.2); // Warm key
    keyLight.position.set(4, 6, 4);
    keyLight.castShadow = !isSoftwareGl;
    if (keyLight.shadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const fillLight = new THREE.HemisphereLight(0xDCE5EC, 0x301934, 1.0); // Cool sky/aubergine ground fill
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xF4B942, 1.4); // Marigold gold rim light
    rimLight.position.set(-4, 3, -3);
    scene.add(rimLight);

    // Procedural Textures
    // 1. Procedural paper line texture
    const makePaperTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 512, 512);

      // Light grid lines / notes lines
      ctx.strokeStyle = '#DCE5EC';
      ctx.lineWidth = 2;
      for (let y = 40; y < 512; y += 32) {
        ctx.beginPath();
        ctx.moveTo(30, y);
        ctx.lineTo(482, y);
        ctx.stroke();
      }

      // Margin line
      ctx.strokeStyle = '#F4B942';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(80, 0);
      ctx.lineTo(80, 512);
      ctx.stroke();

      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return tex;
    };

    // 2. Procedural radial shadow texture for ground contact
    const makeShadowTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;
      const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
      grad.addColorStop(0, 'rgba(48, 25, 52, 0.45)');
      grad.addColorStop(0.5, 'rgba(48, 25, 52, 0.15)');
      grad.addColorStop(1, 'rgba(48, 25, 52, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };

    const paperTex = makePaperTexture();
    const shadowTex = makeShadowTexture();

    // ------------------------------------------------------------------
    // COMPOSITE PROCEDURAL 3D SUBJECTS (3–12 part groups)
    // ------------------------------------------------------------------
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // 1. Stacked Study Notebooks Group
    const notebookGroup = new THREE.Group();

    // Base book 1 (Deep Aubergine)
    const book1CoverMat = new THREE.MeshPhysicalMaterial({
      color: 0x301934,
      roughness: 0.35,
      metalness: 0.1,
      clearcoat: 0.3
    });
    const book1PagesMat = new THREE.MeshStandardMaterial({
      color: 0xF8FAFC,
      roughness: 0.7,
      metalness: 0.05
    });

    const book1Cover = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 1.6), book1CoverMat);
    book1Cover.position.set(0, -0.65, 0);
    book1Cover.castShadow = !isSoftwareGl;
    book1Cover.receiveShadow = !isSoftwareGl;
    notebookGroup.add(book1Cover);

    const book1Pages = new THREE.Mesh(new THREE.BoxGeometry(2.14, 0.18, 1.54), book1PagesMat);
    book1Pages.position.set(0.02, -0.52, 0);
    notebookGroup.add(book1Pages);

    // Base book 2 (Ice Silver Metallic)
    const book2CoverMat = new THREE.MeshPhysicalMaterial({
      color: 0xDCE5EC,
      roughness: 0.2,
      metalness: 0.65,
      clearcoat: 0.8
    });
    const book2Cover = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 1.45), book2CoverMat);
    book2Cover.position.set(-0.05, -0.38, 0.05);
    book2Cover.rotation.y = 0.08;
    book2Cover.castShadow = !isSoftwareGl;
    notebookGroup.add(book2Cover);

    const book2Pages = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.16, 1.4), book1PagesMat);
    book2Pages.position.set(-0.04, -0.26, 0.05);
    book2Pages.rotation.y = 0.08;
    notebookGroup.add(book2Pages);

    // Top Notebook (Deep Aubergine with Marigold ribbon bookmark)
    const book3Cover = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 1.3), book1CoverMat);
    book3Cover.position.set(0.05, -0.14, 0.08);
    book3Cover.rotation.y = -0.12;
    book3Cover.castShadow = !isSoftwareGl;
    notebookGroup.add(book3Cover);

    // Marigold bookmark ribbon
    const ribbonMat = new THREE.MeshPhysicalMaterial({
      color: 0xF4B942,
      roughness: 0.25,
      metalness: 0.2,
      clearcoat: 0.5
    });
    const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, 0.65), ribbonMat);
    ribbon.position.set(0.4, -0.1, 0.72);
    ribbon.rotation.y = -0.12;
    ribbon.rotation.x = 0.25;
    notebookGroup.add(ribbon);

    // FBISE Seal Medallion (Marigold gold emblem on top book)
    const medallionMat = new THREE.MeshPhysicalMaterial({
      color: 0xF4B942,
      metalness: 0.85,
      roughness: 0.18,
      clearcoat: 0.9
    });
    const medallion = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.03, 32), medallionMat);
    medallion.position.set(0.05, -0.09, 0.08);
    medallion.rotation.y = -0.12;
    notebookGroup.add(medallion);

    rootGroup.add(notebookGroup);

    // 2. Floating Academic Mortarboard Cap
    const capGroup = new THREE.Group();
    const capMat = new THREE.MeshPhysicalMaterial({
      color: 0x301934,
      roughness: 0.3,
      metalness: 0.15
    });
    // Diamond top
    const capTop = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.04, 1.4), capMat);
    capTop.rotation.y = Math.PI / 4;
    capGroup.add(capTop);

    // Skull cap base
    const skullCap = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.25, 24), capMat);
    skullCap.position.y = -0.14;
    capGroup.add(skullCap);

    // Center button
    const capButton = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 16), medallionMat);
    capButton.position.y = 0.03;
    capGroup.add(capButton);

    // Hanging Marigold gold tassel
    const tasselMat = new THREE.MeshPhysicalMaterial({
      color: 0xF4B942,
      metalness: 0.7,
      roughness: 0.2
    });
    const tasselCord = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.45, 8), tasselMat);
    tasselCord.position.set(0.28, -0.14, 0.28);
    tasselCord.rotation.z = -0.7;
    capGroup.add(tasselCord);

    const tasselDrop = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.22, 12), tasselMat);
    tasselDrop.position.set(0.5, -0.3, 0.5);
    capGroup.add(tasselDrop);

    capGroup.position.set(1.4, 0.75, 0.3);
    capGroup.rotation.set(0.2, -0.4, 0.15);
    rootGroup.add(capGroup);

    // 3. Floating FBISE Study Sheet with procedural notes lines
    const sheetMat = new THREE.MeshPhysicalMaterial({
      map: paperTex,
      roughness: 0.45,
      metalness: 0.05,
      side: THREE.DoubleSide
    });
    const sheetGeom = new THREE.PlaneGeometry(1.2, 1.6, 8, 8);
    // Subtle curl on the sheet vertices
    const posAttr = sheetGeom.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const u = posAttr.getX(i);
      const v = posAttr.getY(i);
      posAttr.setZ(i, Math.sin(u * 2.2) * 0.08 + Math.cos(v * 2.5) * 0.06);
    }
    sheetGeom.computeVertexNormals();

    const studySheet = new THREE.Mesh(sheetGeom, sheetMat);
    studySheet.position.set(-1.45, 0.5, 0.4);
    studySheet.rotation.set(-0.25, 0.45, -0.18);
    studySheet.castShadow = !isSoftwareGl;
    rootGroup.add(studySheet);

    // 4. Abstract Silver Geometry (Ice Silver Polyhedra & Golden Ring)
    const silverMat = new THREE.MeshPhysicalMaterial({
      color: 0xDCE5EC,
      metalness: 0.85,
      roughness: 0.15,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1
    });

    const icosahedron = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 0), silverMat);
    icosahedron.position.set(1.6, -0.3, 0.8);
    rootGroup.add(icosahedron);

    const goldRingMat = new THREE.MeshPhysicalMaterial({
      color: 0xF4B942,
      metalness: 0.9,
      roughness: 0.15,
      clearcoat: 0.8
    });
    const torus = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.04, 16, 64), goldRingMat);
    torus.position.set(-1.6, -0.4, 0.6);
    torus.rotation.set(0.8, 0.3, 0.4);
    rootGroup.add(torus);

    // 5. Ground Contact Shadow
    const shadowGeo = new THREE.PlaneGeometry(4.2, 3.2);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.8,
      depthWrite: false
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.72;
    rootGroup.add(shadowPlane);

    // ------------------------------------------------------------------
    // INTERACTION & ANIMATION LOOP (Exponential Damping & Software Pacing)
    // ------------------------------------------------------------------
    let mouseX = 0;
    let mouseY = 0;
    let targetRotY = 0;
    let targetRotX = 0;
    let isDragging = false;
    let prevPointerX = 0;
    let prevPointerY = 0;

    const handlePointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevPointerX = e.clientX;
      prevPointerY = e.clientY;
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      if (isDragging) {
        const deltaX = (e.clientX - prevPointerX) * 0.008;
        const deltaY = (e.clientY - prevPointerY) * 0.008;
        targetRotY += deltaX;
        targetRotX += deltaY;
        prevPointerX = e.clientX;
        prevPointerY = e.clientY;
      } else {
        mouseX = nx * 0.25;
        mouseY = ny * 0.15;
      }
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    container.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    // Resize listener
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Loop
    let frameId = 0;
    let clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Gentle floating animations
      studySheet.position.y = 0.5 + Math.sin(time * 1.4) * 0.08;
      studySheet.rotation.z = -0.18 + Math.cos(time * 1.2) * 0.04;

      capGroup.position.y = 0.75 + Math.sin(time * 1.2 + 1.0) * 0.07;
      capGroup.rotation.y = -0.4 + Math.sin(time * 0.8) * 0.06;

      icosahedron.rotation.x = time * 0.4;
      icosahedron.rotation.y = time * 0.5;
      icosahedron.position.y = -0.3 + Math.cos(time * 1.5) * 0.06;

      torus.rotation.x = 0.8 + time * 0.3;
      torus.rotation.y = 0.3 + time * 0.4;
      torus.position.y = -0.4 + Math.sin(time * 1.6) * 0.05;

      // Exponential damping on user tilt
      const targetY = targetRotY + mouseX;
      const targetX = targetRotX + mouseY;
      rootGroup.rotation.y = THREE.MathUtils.damp(rootGroup.rotation.y, targetY, 4, delta);
      rootGroup.rotation.x = THREE.MathUtils.damp(rootGroup.rotation.x, targetX, 4, delta);

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    // Clean up
    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      container.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('resize', handleResize);

      // Dispose
      renderer.dispose();
      paperTex.dispose();
      shadowTex.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[400px] sm:h-[480px] lg:h-[520px] rounded-3xl overflow-hidden bg-gradient-to-br from-[#DCE5EC]/40 via-[#F8FAFC] to-[#EEF4F8] border border-[#DCE5EC]/80 shadow-2xl flex items-center justify-center">
      {/* Background ambient lighting accents */}
      <div className="absolute top-1/4 -left-12 w-64 h-64 bg-[#301934]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-12 w-72 h-72 bg-[#F4B942]/20 rounded-full blur-3xl pointer-events-none" />

      {/* WebGL Mount Container */}
      <div 
        ref={mountRef} 
        className="w-full h-full cursor-grab active:cursor-grabbing select-none"
        title="Interactive FBISE 3D Study Model - Drag to inspect"
      />

      {/* Bottom Compact Collapsible HUD Dock (Directive 5 compliant) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-[92vw] w-auto transition-transform duration-300 z-10 pointer-events-auto">
        <div className="bg-[#151820]/90 text-[#F8FAFC] border border-[#DCE5EC]/20 rounded-full px-3.5 py-1.5 shadow-lg flex items-center gap-2.5 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-[#F4B942]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive 3D Preview</span>
          </div>
          <span className="text-[#DCE5EC]/30">|</span>
          <span className="text-[#DCE5EC]/80 text-[11px] hidden sm:inline">Drag to inspect</span>
          <button 
            type="button"
            onClick={() => {
              // Trigger gentle auto spin / reset
              const evt = new CustomEvent('reset-3d-tilt');
              window.dispatchEvent(evt);
            }}
            className="p-1 hover:bg-[#301934] rounded-full text-[#DCE5EC] transition-colors cursor-pointer"
            title="Reset perspective"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
