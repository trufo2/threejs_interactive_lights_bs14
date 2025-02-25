import * as THREE from 'three/webgpu'
import {OrbitControls} from 'three/addons/controls/OrbitControls.js'
import {DragControls} from 'three/addons/controls/DragControls.js'
import {RectAreaLightHelper} from 'three/addons/helpers/RectAreaLightHelper.js'
import {RectAreaLightTexturesLib} from 'three/addons/lights/RectAreaLightTexturesLib.js'
import GUI from 'lil-gui'
import store from 'store2'

console.warn = () => {};
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
    lights = {
        ambientLight: new THREE.AmbientLight(0xffffff, .1),
        directionalLight: new THREE.DirectionalLight(0x00fffc, 1),
        hemisphereLight: new THREE.HemisphereLight(0xff0000,0x0000ff,.5),
        pointLight: new THREE.PointLight(0xff9000,1,0,1), //intensity,distance(0=noLimit),decay
        rectAreaLight: new THREE.RectAreaLight(0x4e00ff,1,1,1),
        spotLight: new THREE.SpotLight(0x78ff00,2,10,Math.PI*.12,.1,0), //int.,dist.,angle,penumbra,decay
    },
    o_lightsIntensity = {
        ambientLight: 0,
        directionalLight: 0,
        hemisphereLight: 0,
        pointLight: 0,
        rectAreaLight: 0,
        spotLight: 0
    },
    helpers = {
        hemisphereLightHelper: new THREE.HemisphereLightHelper(lights.hemisphereLight, .2),
        directionalLightHelper: new THREE.DirectionalLightHelper(lights.directionalLight, .2),
        pointLightHelper: new THREE.PointLightHelper(lights.pointLight, .2),
        spotLightHelper: new THREE.SpotLightHelper(lights.spotLight),
        rectAreaLightHelper: new RectAreaLightHelper(lights.rectAreaLight)//https://github.com/mrdoob/three.js/issues/28939
    },
    material = new THREE.MeshStandardMaterial(),
    sphere = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 32),material),
    cube = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.75, 0.75),material),
    torus = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.2, 32, 64),material),
    plane = new THREE.Mesh(new THREE.PlaneGeometry(5, 5),material),
    orbitControls = new OrbitControls(camera,canvas),
    dragControls = new DragControls(draggableObjects,camera,canvas),
    clock = new THREE.Clock(),
    gui = new GUI(),
	raycaster = new THREE.Raycaster(),
    defaultParams = {}
gui.hide()
lights.directionalLight.position.set(.3,1,-.3)
lights.pointLight.position.set(1,-.5,1)
THREE.RectAreaLightNode.setLTC(RectAreaLightTexturesLib.init())//!WEBGPU for areaLight
lights.rectAreaLight.position.set(-1.5,0,1.5)
let areaLightTarget = new THREE.Vector3(-.7,-.2,.7)
lights.spotLight.position.set(-.5,1.5,.8)
scene.add(lights.ambientLight,lights.directionalLight,lights.directionalLight.target,lights.hemisphereLight,lights.pointLight,lights.rectAreaLight,lights.spotLight,lights.spotLight.target)
scene.add(helpers.directionalLightHelper,helpers.hemisphereLightHelper,helpers.rectAreaLightHelper,helpers.pointLightHelper,helpers.spotLightHelper)
lights.hemisphereLight.position.x = (-.2)
lights.hemisphereLight.position.y = (-.65)
lights.hemisphereLight.position.z = (1.5)
hemisphereLightHelperProxy.position.copy(lights.hemisphereLight.position)
lights.spotLight.target.position.x = .8
lights.spotLight.target.position.y = -.3
directionalLightHelperProxy.position.copy(lights.directionalLight.position)
pointLightHelperProxy.position.copy(lights.pointLight.position)
spotLightHelperProxy.position.copy(lights.spotLight.position)
spotLightTargetProxy.position.copy(lights.spotLight.target.position)
lights.spotLight.castShadow = true
lights.spotLight.shadow.mapSize.width = 1024
lights.spotLight.shadow.mapSize.height = 1024
lights.spotLight.shadow.camera.near = .01
lights.spotLight.shadow.camera.far = 6
lights.spotLight.shadow.camera.top = 2
lights.spotLight.shadow.camera.bottom = 2
lights.spotLight.shadow.camera.left = 2
lights.spotLight.shadow.camera.right = 2
areaLightHelperProxy.position.copy(lights.rectAreaLight.position)
areaLightTargetProxy.position.copy(areaLightTarget)
Object.keys(lights).forEach(lightName => {
    defaultParams[lightName] = {
        intensity: lights[lightName].intensity,
        color: lights[lightName].color.getHex(),
        ...(lights[lightName].distance !== undefined && { distance: lights[lightName].distance }),
        ...(lights[lightName].decay !== undefined && { decay: lights[lightName].decay }),
        ...(lights[lightName].angle !== undefined && { angle: lights[lightName].angle }),
        ...(lights[lightName].penumbra !== undefined && { penumbra: lights[lightName].penumbra }),
        ...(lights[lightName].width !== undefined && { width: lights[lightName].width }),
        ...(lights[lightName].height !== undefined && { height: lights[lightName].height })
    }
    store.namespace('default').set(lightName, defaultParams[lightName])
})
const directionalLightControl = gui.addFolder('directionalLightControl').title('directional light'),
    guiDirectionalLightColor = {color: lights.directionalLight.color.getHex(THREE.SRGBColorSpace)},
    ambientAndHemisphereLightControl = gui.addFolder('ambientAndHemisphereLightControl').title('ambient & hemisphere light'),
    guiAmbientLightColor = {color: lights.ambientLight.color.getHex(THREE.SRGBColorSpace)},
    guiHemisphereLightSkyColor = {color: lights.hemisphereLight.color.getHex(THREE.SRGBColorSpace)},
    guiHemisphereLightGroundColor = {color: lights.hemisphereLight.groundColor.getHex(THREE.SRGBColorSpace)},
    pointLightControl = gui.addFolder('pointLightControl').title('point light'),
    guiPointLightColor = {color: lights.pointLight.color.getHex(THREE.SRGBColorSpace)},
    spotLightControl = gui.addFolder('spotLightControl').title('spot light'),
    guiSpotLightColor = {color: lights.spotLight.color.getHex(THREE.SRGBColorSpace)},
    rectAreaLightControl = gui.addFolder('rectAreaLightControl').title('rectangular area  light'),
    guiRectAreaLightColor = {color: lights.rectAreaLight.color.getHex(THREE.SRGBColorSpace)}
directionalLightControl.add(lights.directionalLight, 'intensity').min(0).max(16).step(.2)
directionalLightControl.addColor(guiDirectionalLightColor, 'color').onChange((value) => {
    lights.directionalLight.color.setHex(value, THREE.SRGBColorSpace)
    updateCurrentLightParameters()
})
ambientAndHemisphereLightControl.add(lights.ambientLight, 'intensity').min(0).max(2).step(.02).onChange(updateCurrentLightParameters)
ambientAndHemisphereLightControl.addColor(guiAmbientLightColor, 'color').onChange((value) => {
    lights.ambientLight.color.setHex(value, THREE.SRGBColorSpace)
    updateCurrentLightParameters()
})
ambientAndHemisphereLightControl.add(lights.hemisphereLight, 'intensity').min(0).max(4).step(.1).onChange(updateCurrentLightParameters)
ambientAndHemisphereLightControl.addColor(guiHemisphereLightSkyColor, 'color').onChange((value) => {
    lights.hemisphereLight.color.setHex(value, THREE.SRGBColorSpace)
    updateCurrentLightParameters()
})
ambientAndHemisphereLightControl.addColor(guiHemisphereLightGroundColor, 'color').onChange((value) => {
    lights.hemisphereLight.groundColor.setHex(value, THREE.SRGBColorSpace)
    updateCurrentLightParameters()
})
pointLightControl.add(lights.pointLight, 'intensity').min(0).max(16).step(.2).onChange(updateCurrentLightParameters)
pointLightControl.add(lights.pointLight, 'decay').min(0).max(16).step(.2).onChange(updateCurrentLightParameters)
pointLightControl.add(lights.pointLight, 'distance').min(.1).max(8).step(.1).onChange(updateCurrentLightParameters)
pointLightControl.addColor(guiPointLightColor, 'color').onChange((value) => {
    lights.pointLight.color.setHex(value, THREE.SRGBColorSpace)
    updateCurrentLightParameters()
})
spotLightControl.add(lights.spotLight, 'intensity').min(0).max(16).step(.2).onChange(updateCurrentLightParameters)
spotLightControl.add(lights.spotLight, 'angle').min(.01).max(.9).step(.01).onChange(updateCurrentLightParameters)
spotLightControl.add(lights.spotLight, 'penumbra').min(0).max(1).step(.01).onChange(updateCurrentLightParameters)
spotLightControl.add(lights.spotLight, 'decay').min(0).max(4).step(.1).onChange(updateCurrentLightParameters)
spotLightControl.add(lights.spotLight, 'distance').min(.1).max(8).step(.1).onChange(updateCurrentLightParameters)
spotLightControl.addColor(guiSpotLightColor, 'color').onChange((value) => {
    lights.spotLight.color.setHex(value, THREE.SRGBColorSpace)
    updateCurrentLightParameters()
})
rectAreaLightControl.add(lights.rectAreaLight, 'intensity').min(0).max(64).step(.1).onChange(updateCurrentLightParameters)
rectAreaLightControl.add(lights.rectAreaLight, 'width').min(0).max(4).step(.1).onChange(updateCurrentLightParameters)
rectAreaLightControl.add(lights.rectAreaLight, 'height').min(0).max(4).step(.1).onChange(updateCurrentLightParameters)
rectAreaLightControl.addColor(guiRectAreaLightColor, 'color').onChange((value) => {
    lights.rectAreaLight.color.setHex(value, THREE.SRGBColorSpace)
    updateCurrentLightParameters()
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

function getLightParams(light) {
    return {
        color: light.color.getHex(),
        ...(light.distance !== undefined && { distance: light.distance }),
        ...(light.decay !== undefined && { decay: light.decay }),
        ...(light.angle !== undefined && { angle: light.angle }),
        ...(light.penumbra !== undefined && { penumbra: light.penumbra }),
        ...(light.width !== undefined && { width: light.width }),
        ...(light.height !== undefined && { height: light.height })
    }
}
function setCurrentLightParameters() {
    Object.keys(lights).forEach(lightName => {
        const currentParams = store.namespace('current').get(lightName);
        if (currentParams) {
            lights[lightName].intensity = currentParams.intensity
            lights[lightName].color.setHex(currentParams.color)
            if (currentParams.distance !== undefined) lights[lightName].distance = currentParams.distance
            if (currentParams.decay !== undefined) lights[lightName].decay = currentParams.decay
            if (currentParams.angle !== undefined) lights[lightName].angle = currentParams.angle
            if (currentParams.penumbra !== undefined) lights[lightName].penumbra = currentParams.penumbra
            if (currentParams.width !== undefined) lights[lightName].width = currentParams.width
            if (currentParams.height !== undefined) lights[lightName].height = currentParams.height
        }
    })
}
setCurrentLightParameters()
var activeLight = [],
    isSoloMode = false
function updateCurrentLightParameters() {
    if (isSoloMode) {
        let zeroIntensityCount = 0;
        Object.keys(lights).forEach(lightName => {
            if (lights[lightName].intensity === 0) {
                zeroIntensityCount++
            }
        })
        Object.keys(lights).forEach(lightName => {
            const lightParams_1 = getLightParams(lights[lightName]);
            if (zeroIntensityCount < 5 || lights[lightName].intensity !== 0) {
                lightParams_1.intensity = lights[lightName].intensity
            }
            store.namespace('current').set(lightName, lightParams_1)
        })
        return
    }
    Object.keys(lights).forEach(lightName => {
        const lightParams_2 = {
            intensity: lights[lightName].intensity,
            ...getLightParams(lights[lightName])
        }
        store.namespace('current').set(lightName, lightParams_2);
    })
    lights.directionalLight.color.setHex(guiDirectionalLightColor.color)
    lights.ambientLight.color.setHex(guiAmbientLightColor.color)
    lights.hemisphereLight.color.setHex(guiHemisphereLightSkyColor.color)
    lights.hemisphereLight.groundColor.setHex(guiHemisphereLightGroundColor.color)
    lights.pointLight.color.setHex(guiPointLightColor.color)
    lights.spotLight.color.setHex(guiSpotLightColor.color)
    lights.rectAreaLight.color.setHex(guiRectAreaLightColor.color)
}
function revertToAllLightsMode() {
    Object.keys(lights).forEach(lightName => {
        if (!activeLight.includes(lights[lightName])) {
            lights[lightName].intensity = o_lightsIntensity[lightName]
        }
    })
    o_lightsIntensity.saved = false
    isSoloMode = false
    updateCurrentLightParameters();
}
function copyDefaultToCurrentNamespace() {
    Object.keys(defaultParams).forEach(lightName => {
        store.namespace('current').set(lightName, defaultParams[lightName])
    })
}

const tick = () => {
    const elapsedTime = clock.getElapsedTime()
    cube.rotation.y = 0.1 * elapsedTime
    torus.rotation.y = 0.1 * elapsedTime
    cube.rotation.x = 0.15 * elapsedTime
    torus.rotation.x = 0.15 * elapsedTime
    helpers.directionalLightHelper.update()
    helpers.spotLightHelper.update()
    areaLightTarget.copy(areaLightTargetProxy.position)
    lights.rectAreaLight.lookAt(areaLightTarget)
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
    lights.directionalLight.position.copy(directionalLightHelperProxy.position)
    lights.pointLight.position.copy(pointLightHelperProxy.position)
    lights.spotLight.position.copy(spotLightHelperProxy.position)
    lights.spotLight.target.position.copy(spotLightTargetProxy.position)
    lights.rectAreaLight.position.copy(areaLightHelperProxy.position)
})
document.addEventListener('dblclick', (event) => {
    if (event.target.closest('#cox')) {
        if (event.target.id === "c") {
            copyDefaultToCurrentNamespace()
            setCurrentLightParameters()
            //updateCurrentLightParameters()
        } else if (event.target.id === "o") {
            if (!isSoloMode) {
                alert("Double-click a light to select it first.")
                return
            } else {
                revertToAllLightsMode()
            }
        } else if (event.target.id === "x") {
            const toggled = draggableObjects[0].visible === false
            draggableObjects.forEach(obj => {
                obj.visible = toggled
                hemisphereLightHelperProxy.visible = toggled
    
            })
            Object.values(helpers).forEach(helper => {
                helper.visible = toggled
            })
        }
        return
    }
})
canvas.addEventListener('dblclick', (event) => {
	const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    )
    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects([directionalLightHelperProxy,hemisphereLightHelperProxy,pointLightHelperProxy,spotLightHelperProxy,areaLightHelperProxy])
    if (intersects.length > 0) {
        const object = intersects[0].object
        if (isSoloMode) {
            revertToAllLightsMode();
        }
        if (object === directionalLightHelperProxy) {
            gui.show()
            directionalLightControl.show()
            ambientAndHemisphereLightControl.hide()
            pointLightControl.hide()
            spotLightControl.hide()
            rectAreaLightControl.hide()
            activeLight = [lights.directionalLight]
        } else if (object === hemisphereLightHelperProxy) {
            gui.show()
            ambientAndHemisphereLightControl.show()
            pointLightControl.hide()
            directionalLightControl.hide()
            spotLightControl.hide()
            rectAreaLightControl.hide()
            activeLight = [lights.ambientLight,lights.hemisphereLight]
        } else if (object === pointLightHelperProxy) {
            gui.show()
            pointLightControl.show()
            directionalLightControl.hide()
            ambientAndHemisphereLightControl.hide()
            spotLightControl.hide()
            rectAreaLightControl.hide()
            activeLight = [lights.pointLight]
        } else if (object === spotLightHelperProxy) {
            gui.show()
            spotLightControl.show()
            pointLightControl.hide()
            directionalLightControl.hide(
            ambientAndHemisphereLightControl.hide())
            rectAreaLightControl.hide()
            activeLight = [lights.spotLight]
        } else if (object === areaLightHelperProxy) {
            gui.show()
            rectAreaLightControl.show()
            ambientAndHemisphereLightControl.hide()
            spotLightControl.hide()
            pointLightControl.hide()
            directionalLightControl.hide()
            activeLight = [lights.rectAreaLight]
        } else {
            gui.hide()
        }
        Object.keys(lights).forEach(lightName => {
            if (!activeLight.includes(lights[lightName])) {
                o_lightsIntensity[lightName] = lights[lightName].intensity;
                lights[lightName].intensity = 0;
            }
        })
        isSoloMode = true
    } else {
        gui.hide();
    }
})