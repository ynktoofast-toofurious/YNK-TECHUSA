import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const VERT = /* glsl */`
  uniform float uTime;
  uniform float uScroll;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec3 pos = position;
    float wave = sin(pos.y * 4.0 + uTime * 2.0 + uScroll * 0.005) * 0.04 * (uScroll * 0.002 + 0.3);
    pos.x += wave;
    pos.z += wave * 0.5;
    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`

const FRAG = /* glsl */`
  uniform float uTime;
  uniform float uScroll;
  uniform vec3 camPos;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  void main() {
    vec3 coreColor = vec3(0.043, 0.067, 0.125);
    vec3 midColor  = vec3(0.027, 0.502, 0.651);
    vec3 rimColor  = vec3(0.161, 0.710, 0.910);
    vec3 viewDir = normalize(camPos - vWorldPos);
    float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.8);
    float band = sin(vUv.y * 12.0 - uTime * 1.8 + uScroll * 0.006) * 0.5 + 0.5;
    band = pow(band, 3.0) * 0.35;
    float lat = vUv.y;
    vec3 base = mix(coreColor, midColor, lat);
    base = mix(base, rimColor, fresnel * 0.7);
    base += rimColor * band;
    float pulse = sin(uTime * 3.0) * 0.5 + 0.5;
    float scrollGlow = min(uScroll * 0.001, 1.0);
    base += rimColor * pulse * scrollGlow * 0.25;
    base += rimColor * pow(fresnel, 1.5) * 0.5;
    gl_FragColor = vec4(base, 0.97);
  }
`

export default function AIBall3D() {
  const mountRef = useRef(null)
  const rendererRef = useRef(null)
  const modelRef = useRef(null)
  const animFrameRef = useRef(null)
  const scrollYRef = useRef(0)
  const prevScrollRef = useRef(0)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    const w = mount.clientWidth || 500
    const h = mount.clientHeight || 500
    const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100)
    camera.position.set(0, 0, 3.8)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(w, h)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    rendererRef.current = renderer
    mount.appendChild(renderer.domElement)

    const uniforms = {
      uTime:   { value: 0 },
      uScroll: { value: 0 },
      camPos:  { value: camera.position },
    }

    // Glow halo
    const size = 256
    const glowCanvas = document.createElement('canvas')
    glowCanvas.width = size; glowCanvas.height = size
    const ctx = glowCanvas.getContext('2d')
    const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2)
    grad.addColorStop(0,   'rgba(41,181,232,0.40)')
    grad.addColorStop(0.45,'rgba(41,181,232,0.10)')
    grad.addColorStop(1,   'rgba(41,181,232,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)
    const glowTex = new THREE.CanvasTexture(glowCanvas)

    const halo = new THREE.Mesh(
      new THREE.PlaneGeometry(4.2, 4.2),
      new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false })
    )
    halo.position.z = -0.5
    scene.add(halo)

    // Load GLB
    const loader = new GLTFLoader()
    loader.load('/ai-ball.glb', (gltf) => {
      const model = gltf.scene
      model.scale.set(1.5, 1.5, 1.5)
      model.traverse((child) => {
        if (child.isMesh) {
          child.material = new THREE.ShaderMaterial({
            vertexShader: VERT,
            fragmentShader: FRAG,
            uniforms,
            transparent: true,
          })
        }
      })
      scene.add(model)
      modelRef.current = model
    }, undefined, (err) => console.error('GLB error:', err))

    // Particle ring
    const count = 180
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const r = 1.55 + (Math.random() - 0.5) * 0.25
      positions[i*3]   = Math.cos(angle) * r
      positions[i*3+1] = (Math.random() - 0.5) * 0.4
      positions[i*3+2] = Math.sin(angle) * r
    }
    const ringGeo = new THREE.BufferGeometry()
    ringGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const ring = new THREE.Points(ringGeo, new THREE.PointsMaterial({
      color: 0x29b5e8, size: 0.025, transparent: true, opacity: 0.7, sizeAttenuation: true,
    }))
    scene.add(ring)

    const clock = new THREE.Clock()

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()
      prevScrollRef.current += (scrollYRef.current - prevScrollRef.current) * 0.06
      const scroll = prevScrollRef.current
      uniforms.uTime.value = t
      uniforms.uScroll.value = scroll
      if (modelRef.current) {
        modelRef.current.rotation.y = t * 0.28 + scroll * 0.003
        modelRef.current.rotation.x = Math.sin(t * 0.3) * 0.12 + scroll * 0.0008
        modelRef.current.rotation.z = Math.sin(t * 0.2) * 0.05
      }
      ring.rotation.y = -t * 0.15
      ring.rotation.x = Math.sin(t * 0.25) * 0.1
      const pulse = 0.92 + Math.sin(t * 1.8) * 0.08
      halo.scale.set(pulse, pulse, pulse)
      renderer.render(scene, camera)
    }
    animate()

    const onScroll = () => { scrollYRef.current = window.scrollY }
    window.addEventListener('scroll', onScroll, { passive: true })

    const onResize = () => {
      const nw = mount.clientWidth
      const nh = mount.clientHeight
      if (!nw || !nh) return
      camera.aspect = nw / nh
      camera.updateProjectionMatrix()
      renderer.setSize(nw, nh)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animFrameRef.current)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
}
