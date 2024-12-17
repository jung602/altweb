import { SceneConfig } from '../types/scene';

export const scenesData: SceneConfig[] = [
  {
    id: 1,
    title: "Klar's Room",
    location: "Tokyo, Japan",
    explanation: [{
      img: "",
      content: "Klar's Room represents a modern minimalist approach to living spaces in Tokyo. The design emphasizes functionality while maintaining aesthetic appeal through clean lines and a muted color palette. The space features custom-built furniture that maximizes the available square footage, a common necessity in Tokyo's urban environment. The lighting design creates depth through layered illumination, combining natural light with carefully placed artificial sources. The material selection focuses on sustainable and durable options, including locally sourced wood and recycled metals. Each element has been carefully considered to create a harmonious living environment that reflects both Japanese and contemporary international design principles."
    }],
    model: {
      component: "Alt1",
      scale: 1,
      position: [0, -1.2, 0],
      rotation: [0, 0, 0],
    },
    camera: {
      position: [5, 6.5, -10],
      fov: 160
    },
    lights: {
      directional: {
        position: [5, 10, 5],
        intensity: 10
      }
    },
    background: {
      color: '#000000'
    },
    environment: {
      preset: 'none'
    }
  },
  {
    id: 2,
    title: "Lee's Room",
    location: "Seoul, South Korea",
    explanation: [{
      img: "",
      content: ""
    },],
    model: {
      component: "Alt2",
      scale: .9,
      position: [0, -1.2, 0],
      rotation: [0, 0, 0],
    },
    camera: {
      position: [5, 6.5, -10],
      fov: 160
    },
    lights: {
      directional: {
        position: [5, 10, 5],
        intensity: 10
      }
    },
    background: {
      color: '#000000'
    },
    environment: {
      preset: 'none'
    }
  },
];