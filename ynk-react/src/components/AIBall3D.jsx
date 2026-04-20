import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export default function AIBall3D() {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const modelRef = useRef(null)
  const animFrameRef = useRef(null)
  const scrollYRef = useRef(0)
  const prevScrollRef = useRef(0)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    // Scene
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Camera
    const w = mount.clientWidth
    const h = mount.clientHeight
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100)
    camera.position.set(0, 0, 4)

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(w, h)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    rendererRef.current = renderer
    mount.appendChild(renderer.domElement)

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambient)

    const key = new THREE.DirectionalLight(0x29b5e8, 2.5)
    key.position.set(3, 4, 5)
    key.castShadow = true
    scene.add(key)

    const fill = new THREE.DirectionalLight(0x5ccef5, 1.0)
    fill.position.set(-3, 1, -2)
    scene.add(fill)

    const rim = new THREE.PointLight(0x06b6d4, 1.8, 12)
    rim.position.set(0, 3, -3)
    scene.add(rim)

    // Load GLB
    const loader = new GLTFLoader()
    loader.load(
      '/ai-ball.glb',
      (gltf) => {
        const model = gltf.scene
        model.scale.set(1.4, 1.4, 1.4)
        model.position.set(0, 0, 0)
        scene.add(model)
        modelRef.current = model
      },
      undefined,
      (err) => console.error('GLB load error:', err)
    )

    // Idle rotation + scroll rotation
    let baseRotX = 0
    let baseRotY = 0

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate)

      if (modelRef.current) {
        // Smooth scroll-driven rotation
        const scrollDelta = scrollYRef.current - prevScrollRef.current
        prevScrollRef.current += scrollDelta * 0.08

        baseRotY += 0.005 // slow idle spin
        modelRef.current.rotation.y = baseRotY + prevScrollRef.current * 0.003
        modelRef.current.rotation.x = baseRotX + prevScrollRef.current * 0.001
      }

      renderer.render(scene, camera)
    }
    animate()

    // Scroll listener
    const onScroll = () => {
      scrollYRef.current = window.scrollY
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    // Resize
    const onResize = () => {
      const nw = mount.clientWidth
      const nh = mount.clientHeight
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
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
      }}
    />
  )
}
