import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const VERT = `
  uniform float uTime;
  uniform float uScroll;
  uniform float uMouseDist;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec3 pos = position;
    // Massive multi-frequency organic distortion
    float d1 = sin(pos.y * 2.5  + uTime * 1.4) * 0.55;
    float d2 = sin(pos.x * 3.8  + uTime * 2.1) * 0.42;
    float d3 = cos(pos.z * 3.0  + uTime * 1.7) * 0.38;
    float d4 = sin((pos.x + pos.z) * 5.0 + uTime * 2.8) * 0.28;
    float d5 = cos((pos.y - pos.x) * 4.2 + uTime * 3.2) * 0.22;
    float distort = d1 + d2 + d3 + d4 + d5;
    pos += normalize(pos) * distort;
    // Scroll-driven extra spike
    float scrollSpike = uScroll * 0.0015;
    pos += normalize(pos) * sin(length(pos) * 6.0 + uTime * 2.5) * scrollSpike;
    // Mouse expand
    float expand = uMouseDist * 0.35;
    pos += normalize(pos) * expand;
    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`

const FRAG = `
  uniform float uTime;
  uniform float uScroll;
  uniform float uMouseDist;
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
    base += rimColor * uMouseDist * 0.4;
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
  const mouseRef = useRef({ x: 0, y: 0 })
  const targetRotRef = useRef({ x: 0, y: 0 })
  const currentRotRef = useRef({ x: 0, y: 0 })
  const mouseDistRef = useRef(0)
  const mouseHasMovedRef = useRef(true)   // autostart — no wait for mouse
  const animTimeRef = useRef(0)

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
      uTime:      { value: 0 },
      uScroll:    { value: 0 },
      uMouseDist: { value: 0 },
      camPos:     { value: camera.position },
    }

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

    const loader = new GLTFLoader()
    loader.load('/ai-ball.glb', (gltf) => {
      const model = gltf.scene
      model.scale.set(0.1875, 0.1875, 0.1875)
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

    const count = 180
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const r = 0.3 + (Math.random() - 0.5) * 0.05
      positions[i*3]   = Math.cos(angle) * r
      positions[i*3+1] = (Math.random() - 0.5) * 0.3
      positions[i*3+2] = Math.sin(angle) * r
    }
    const ringGeo = new THREE.BufferGeometry()
    ringGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const ring = new THREE.Points(ringGeo, new THREE.PointsMaterial({
      color: 0x29b5e8, size: 0.022, transparent: true, opacity: 0.7, sizeAttenuation: true,
    }))
    scene.add(ring)

    let lastTime = performance.now()

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate)
      const now = performance.now()
      const delta = (now - lastTime) / 1000
      lastTime = now

      // Static until first mouse interaction
      if (!mouseHasMovedRef.current) {
        renderer.render(scene, camera)
        return
      }

      animTimeRef.current += delta
      const t = animTimeRef.current

      prevScrollRef.current += (scrollYRef.current - prevScrollRef.current) * 0.06
      const scroll = prevScrollRef.current

      targetRotRef.current.y = mouseRef.current.x * 0.9
      targetRotRef.current.x = -mouseRef.current.y * 0.6
      currentRotRef.current.x += (targetRotRef.current.x - currentRotRef.current.x) * 0.05
      currentRotRef.current.y += (targetRotRef.current.y - currentRotRef.current.y) * 0.05

      const mdist = Math.max(0, 1 - Math.sqrt(mouseRef.current.x ** 2 + mouseRef.current.y ** 2) * 1.4)
      mouseDistRef.current += (mdist - mouseDistRef.current) * 0.08

      uniforms.uTime.value = t
      uniforms.uScroll.value = scroll
      uniforms.uMouseDist.value = mouseDistRef.current

      if (modelRef.current) {
        modelRef.current.rotation.y = t * 0.2 + scroll * 0.003 + currentRotRef.current.y
        modelRef.current.rotation.x = Math.sin(t * 0.3) * 0.08 + scroll * 0.0008 + currentRotRef.current.x
        modelRef.current.rotation.z = Math.sin(t * 0.2) * 0.04
        const hoverScale = 0.1875 + mouseDistRef.current * 0.04
        modelRef.current.scale.setScalar(hoverScale)
      }

      ring.rotation.y = -t * 0.15 + currentRotRef.current.y * 0.3
      ring.rotation.x = Math.sin(t * 0.25) * 0.1

      const pulse = 0.92 + Math.sin(t * 1.8) * 0.08 + mouseDistRef.current * 0.12
      halo.scale.set(pulse, pulse, pulse)

      renderer.render(scene, camera)
    }
    animate()

    const onMouseMove = (e) => {
      mouseHasMovedRef.current = true
      const rect = mount.getBoundingClientRect()
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouseRef.current.y = ((e.clientY - rect.top) / rect.height) * 2 - 1
    }
    window.addEventListener('mousemove', onMouseMove)

    // ── Gyroscope (mobile) ───────────────────────────────────────────
    const onGyro = (e) => {
      mouseHasMovedRef.current = true
      // gamma: left/right tilt (-90..90), beta: front/back (-180..180)
      // Offset beta by 60° for natural portrait hold angle
      const gx = Math.max(-1, Math.min(1, (e.gamma || 0) / 45))
      const gy = Math.max(-1, Math.min(1, ((e.beta || 0) - 60) / 45))
      mouseRef.current.x = gx
      mouseRef.current.y = gy
    }
    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    if (isMobile && window.DeviceOrientationEvent) {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        // iOS 13+ — must request on user gesture
        const requestGyro = () => {
          DeviceOrientationEvent.requestPermission()
            .then((state) => {
              if (state === 'granted') window.addEventListener('deviceorientation', onGyro)
            })
            .catch(() => {})
        }
        document.addEventListener('touchstart', requestGyro, { once: true })
      } else {
        window.addEventListener('deviceorientation', onGyro)
      }
    }
    // ────────────────────────────────────────────────────────────────

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
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('deviceorientation', onGyro)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div
      ref={mountRef}
      style={{ width: '100%', height: '100%', cursor: 'crosshair' }}
    />
  )
}