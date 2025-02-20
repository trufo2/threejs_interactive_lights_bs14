import favicon from '../src/favicon.ico'
import * as THREE from 'three/webgpu'
import {OrbitControls} from 'three/addons/controls/OrbitControls.js'
import {DragControls} from 'three/addons/controls/DragControls.js'
import {RectAreaLightHelper} from 'three/addons/helpers/RectAreaLightHelper.js'
import {RectAreaLightTexturesLib} from 'three/addons/lights/RectAreaLightTexturesLib.js'
import GUI from 'lil-gui'

document.querySelector("link[rel='icon']").href = 'favicon'
function createHelperProxy(colorData) {
    const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(.15),
        new THREE.MeshBasicMaterial({transparent:true,opacity:.5,color:colorData})
    )
    return mesh
}
const renderer = new THREE.WebGPURenderer({
        antialias: true
    }),
    canvas = renderer.domElement,
    scene = new THREE.Scene(),
    directionalLightHelperProxy = createHelperProxy('#00FFFF'),
    hemisphereLightHelperProxy = createHelperProxy('purple'),
    pointLightHelperProxy = createHelperProxy('orange' ),
    spotLightHelperProxy = createHelperProxy('green'),
    spotLightTargetProxy = createHelperProxy('yellowgreen'),
    areaLightHelperProxy = createHelperProxy('#0096FF'),
    areaLightTargetProxy = createHelperProxy('#0096FF'),
    draggableObjects = [directionalLightHelperProxy,pointLightHelperProxy,spotLightHelperProxy,spotLightTargetProxy,areaLightHelperProxy,areaLightTargetProxy]
scene.add(directionalLightHelperProxy,hemisphereLightHelperProxy,pointLightHelperProxy,spotLightHelperProxy,spotLightTargetProxy,areaLightHelperProxy,areaLightTargetProxy)
document.body.appendChild(renderer.domElement)
const sizes = {
        width: window.innerWidth,
        height: window.innerHeight
    },
    camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100),
    ambientLight = new THREE.AmbientLight(),
    directionalLight = new THREE.DirectionalLight(0x00fffc, 1),
    hemisphereLight = new THREE.HemisphereLight(0xff0000,0x0000ff,.5),
    pointLight = new THREE.PointLight(0xff9000,1,0,1), //intensity,distance(0=noLimit),decay
    rectAreaLight = new THREE.RectAreaLight(0x4e00ff,1,1,1),
    spotLight = new THREE.SpotLight(0x78ff00,2,10,Math.PI*.12,.1,0), //int.,dist.,angle,penumbra,decay
    hemisphereLightHelper = new THREE.HemisphereLightHelper(hemisphereLight,.2),
    directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight,.2),
    pointLightHelper = new THREE.PointLightHelper(pointLight,.2),
    spotLightHelper = new THREE.SpotLightHelper(spotLight),
    rectAreaLightHelper = new RectAreaLightHelper(rectAreaLight),//https://github.com/mrdoob/three.js/issues/28939
    material = new THREE.MeshStandardMaterial(),
    sphere = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 32),material),
    cube = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.75, 0.75),material),
    torus = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.2, 32, 64),material),
    plane = new THREE.Mesh(new THREE.PlaneGeometry(5, 5),material),
    orbitControls = new OrbitControls(camera,canvas),
    dragControls = new DragControls(draggableObjects,camera,canvas),
    clock = new THREE.Clock(),
    gui = new GUI(),
	mouse = new THREE.Vector2(),
	raycaster = new THREE.Raycaster()
gui.hide()
ambientLight.intensity = .1
ambientLight.color = new THREE.Color(0xffffff)
directionalLight.position.set(.3,1,-.3)
pointLight.position.set(1,-.5,1)
THREE.RectAreaLightNode.setLTC(RectAreaLightTexturesLib.init())//!WEBGPU for areaLight
rectAreaLight.position.set(-1.5,0,1.5)
let areaLightTarget = new THREE.Vector3(-.7,-.2,.7)
spotLight.position.set(-.5,1.5,.8)
scene.add(ambientLight,directionalLight,directionalLight.target,hemisphereLight,pointLight,rectAreaLight,spotLight,spotLight.target)
scene.add(directionalLightHelper,hemisphereLightHelper,rectAreaLightHelper,pointLightHelper,spotLightHelper)
hemisphereLight.position.x = (-.2)
hemisphereLight.position.y = (-.65)
hemisphereLight.position.z = (1.5)
hemisphereLightHelperProxy.position.copy(hemisphereLight.position)
spotLight.target.position.x = .8
spotLight.target.position.y = -.3
directionalLightHelperProxy.position.copy(directionalLight.position)
pointLightHelperProxy.position.copy(pointLight.position)
spotLightHelperProxy.position.copy(spotLight.position)
spotLightTargetProxy.position.copy(spotLight.target.position)
spotLight.castShadow = true
spotLight.shadow.mapSize.width = 1024
spotLight.shadow.mapSize.height = 1024
spotLight.shadow.camera.near = .01
spotLight.shadow.camera.far = 6
spotLight.shadow.camera.top = 2
spotLight.shadow.camera.bottom = 2
spotLight.shadow.camera.left = 2
spotLight.shadow.camera.right = 2
areaLightHelperProxy.position.copy(rectAreaLight.position)
areaLightTargetProxy.position.copy(areaLightTarget)
const directionalLightControl = gui.addFolder('directionalLightControl').title('directional light'),
    guiDirectionalLightColor = {color: directionalLight.color.getHex(THREE.SRGBColorSpace)},
    ambientAndHemisphereLightControl = gui.addFolder('ambientAndHemisphereLightControl').title('ambient & hemisphere light'),
    guiAmbientLightColor = {color: ambientLight.color.getHex(THREE.SRGBColorSpace)},
    guiHemisphereLightSkyColor = {color: hemisphereLight.color.getHex(THREE.SRGBColorSpace)},
    guiHemisphereLightGroundColor = {color: hemisphereLight.groundColor.getHex(THREE.SRGBColorSpace)},
    pointLightControl = gui.addFolder('pointLightControl').title('point light'),
    guiPointLightColor = {color: pointLight.color.getHex(THREE.SRGBColorSpace)},
    spotLightControl = gui.addFolder('spotLightControl').title('spot light'),
    guiSpotLightColor = {color: spotLight.color.getHex(THREE.SRGBColorSpace)},
    rectAreaLightControl = gui.addFolder('rectAreaLightControl').title('rectangular area  light'),
    guiRectAreaLightColor = {color: rectAreaLight.color.getHex(THREE.SRGBColorSpace)}
directionalLightControl.add(directionalLight, 'intensity').min(0).max(16).step(.2)
directionalLightControl.addColor(guiDirectionalLightColor, 'color').onChange((value) => {
    directionalLight.color.setHex(value, THREE.SRGBColorSpace)
})
ambientAndHemisphereLightControl.add(ambientLight, 'intensity').min(0).max(2).step(.02)
ambientAndHemisphereLightControl.addColor(guiAmbientLightColor, 'color').onChange((value) => {
    ambientLight.color.setHex(value, THREE.SRGBColorSpace)
})
ambientAndHemisphereLightControl.add(hemisphereLight, 'intensity').min(0).max(4).step(.1)
ambientAndHemisphereLightControl.addColor(guiHemisphereLightSkyColor, 'color').onChange((value) => {
    hemisphereLight.color.setHex(value, THREE.SRGBColorSpace)
})
ambientAndHemisphereLightControl.addColor(guiHemisphereLightGroundColor, 'color').onChange((value) => {
    hemisphereLight.groundColor.setHex(value, THREE.SRGBColorSpace)
})
pointLightControl.add(pointLight, 'intensity').min(0).max(16).step(.2)
pointLightControl.add(pointLight, 'decay').min(0).max(16).step(.2)
pointLightControl.add(pointLight, 'distance').min(.1).max(8).step(.1)
pointLightControl.addColor(guiPointLightColor, 'color').onChange((value) => {
    pointLight.color.setHex(value, THREE.SRGBColorSpace)
})
spotLightControl.add(spotLight, 'intensity').min(0).max(16).step(.2)
spotLightControl.add(spotLight, 'angle').min(.01).max(.9).step(.01)
spotLightControl.add(spotLight, 'penumbra').min(0).max(1).step(.01)
spotLightControl.add(spotLight, 'decay').min(0).max(4).step(.1)
spotLightControl.add(spotLight, 'distance').min(.1).max(8).step(.1)
spotLightControl.addColor(guiSpotLightColor, 'color').onChange((value) => {
    spotLight.color.setHex(value, THREE.SRGBColorSpace)
})
rectAreaLightControl.add(rectAreaLight, 'intensity').min(0).max(64).step(1)
rectAreaLightControl.add(rectAreaLight, 'width').min(0).max(4).step(.1)
rectAreaLightControl.add(rectAreaLight, 'height').min(0).max(4).step(.1)
rectAreaLightControl.addColor(guiRectAreaLightColor, 'color').onChange((value) => {
    rectAreaLight.color.setHex(value, THREE.SRGBColorSpace)
})
material.roughness = 0.4
sphere.position.x = - 1.5
sphere.castShadow = true
cube.castShadow = true
torus.position.x = 1.5
torus.castShadow = true
plane.rotation.x = - Math.PI * 0.5
plane.position.y = - 0.65
plane.receiveShadow = true
camera.position.x = 1
camera.position.y = 1
camera.position.z = 2.53
scene.add(camera,plane,cube,sphere,torus)
orbitControls.enableDamping = true
orbitControls.update()
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap

const tick = () => {
    const elapsedTime = clock.getElapsedTime()
    cube.rotation.y = 0.1 * elapsedTime
    torus.rotation.y = 0.1 * elapsedTime
    cube.rotation.x = 0.15 * elapsedTime
    torus.rotation.x = 0.15 * elapsedTime
    directionalLightHelper.update()
    spotLightHelper.update()
    areaLightTarget.copy(areaLightTargetProxy.position)
    rectAreaLight.lookAt(areaLightTarget)
    renderer.renderAsync(scene, camera)
    window.requestAnimationFrame(tick)
}
tick()

window.addEventListener('resize', () => {
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})
dragControls.addEventListener('dragstart', () => orbitControls.enabled = false)
dragControls.addEventListener('dragend', () => orbitControls.enabled = true)
dragControls.addEventListener('hoveron', () => canvas.style.cursor = 'pointer')
dragControls.addEventListener('hoveroff', () => canvas.style.cursor = 'auto')
dragControls.addEventListener('drag', () => {
    directionalLight.position.copy(directionalLightHelperProxy.position)
    pointLight.position.copy(pointLightHelperProxy.position)
    spotLight.position.copy(spotLightHelperProxy.position)
    spotLight.target.position.copy(spotLightTargetProxy.position)
    rectAreaLight.position.copy(areaLightHelperProxy.position)
})
document.addEventListener('dblclick', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects([directionalLightHelperProxy,hemisphereLightHelperProxy,pointLightHelperProxy,spotLightHelperProxy,areaLightHelperProxy])
    if (intersects.length > 0) {
        const object = intersects[0].object
        if (object === directionalLightHelperProxy) {
            gui.show()
            directionalLightControl.show()
            ambientAndHemisphereLightControl.hide()
            pointLightControl.hide()
            spotLightControl.hide()
            rectAreaLightControl.hide()
        } else if (object === hemisphereLightHelperProxy) {
            gui.show()
            ambientAndHemisphereLightControl.show()
            pointLightControl.hide()
            directionalLightControl.hide()
            spotLightControl.hide()
            rectAreaLightControl.hide()
        } else if (object === pointLightHelperProxy) {
            gui.show()
            pointLightControl.show()
            directionalLightControl.hide()
            ambientAndHemisphereLightControl.hide()
            spotLightControl.hide()
            rectAreaLightControl.hide()
        } else if (object === spotLightHelperProxy) {
            gui.show()
            spotLightControl.show()
            pointLightControl.hide()
            directionalLightControl.hide(
            ambientAndHemisphereLightControl.hide())
            rectAreaLightControl.hide()
        } else if (object === areaLightHelperProxy) {
            gui.show()
            rectAreaLightControl.show()
            ambientAndHemisphereLightControl.hide()
            spotLightControl.hide()
            pointLightControl.hide()
            directionalLightControl.hide()
        } else {gui.hide()}
    } else {gui.hide()}
})