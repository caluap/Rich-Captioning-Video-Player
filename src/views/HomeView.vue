<script setup>
import { reactive, computed, onMounted, watch, ref, inject } from 'vue'

import ColorPicker from '@/components/ColorPicker.vue'

/* global chroma */

const scrollingCaptions = false,
  debugCaptionSetup = false,
  inputsArray = {},
  // not really a "list" for this version, but yeah
  listOfVideos = {
    video_src: '/Camila_Ledo_Monologue_-_Far_Away.mp4',
    captions: '/Camila_Ledo_Monologue_-_Far_Away.vtt'
  },
  materialIcons = {
    None: 'select',
    'Baseline-shift': 'swap_vert',
    'Background-color': 'colors',
    'Font-color': 'format_paint',
    'Font-weight': 'line_weight',
    Opacity: 'opacity',
    'Font-size': 'format_size',
    'Letter-spacing': 'swap_horiz'
  },
  originalStyles = {
    None: {},
    'Background-color': {
      values: ['#ea004d', '#006815'],
      // generated at https://medialab.github.io/iwanthue/ with
      // H:0-360, C:50-100, L:0-50, hard (Force vector)
      options: [
        [
          '#333333',
          '#cccccc',
          '#b55398',
          '#006815',
          '#0157ed',
          '#b74400',
          '#37008d',
          '#ea004d',
          '#7d0077',
          '#ae3a55'
        ],
        [
          '#333333',
          '#cccccc',
          '#b55398',
          '#006815',
          '#0157ed',
          '#b74400',
          '#37008d',
          '#ea004d',
          '#7d0077',
          '#ae3a55'
        ]
      ]
    },
    'Baseline-shift': {
      values: [1],
      options: [
        {
          lower_bound: -0.25,
          upper_bound: 0.25,
          name: 'Discrete'
        },
        {
          lower_bound: -0.5,
          upper_bound: 0.5,
          name: 'Normal'
        },
        {
          lower_bound: -0.7,
          upper_bound: 0.7,
          name: 'Extreme'
        }
      ]
    },
    'Font-color': {
      values: ['#ff5179', '#019905'],
      // H:0-360, C:50-100, L:50-100, hard (Force Vector)
      options: [
        ['#ffd34e', '#3386ff', '#40ff86', '#b14cc3', '#019905', '#ff66ce', '#709d46', '#ff5179'],
        ['#ffd34e', '#3386ff', '#40ff86', '#b14cc3', '#019905', '#ff66ce', '#709d46', '#ff5179']
      ]
    },
    'Font-size': {
      values: [1],
      options: [
        {
          lower_bound: 1.0,
          upper_bound: 1.3,
          name: 'Discrete'
        },
        {
          lower_bound: 1.0,
          upper_bound: 1.7,
          name: 'Normal'
        },
        {
          lower_bound: 1.0,
          upper_bound: 2.2,
          name: 'Extreme'
        }
      ]
    },
    'Font-weight': {
      values: [1],
      options: [
        {
          lower_bound: 400,
          upper_bound: 500,
          name: 'Discrete'
        },
        {
          lower_bound: 350,
          upper_bound: 700,
          name: 'Normal'
        },
        {
          lower_bound: 300,
          upper_bound: 1000,
          name: 'Extreme'
        }
      ]
    },
    'Letter-spacing': {
      values: [1],
      options: [
        {
          lower_bound: -0.125,
          upper_bound: 0.125,
          name: 'Discrete'
        },
        {
          lower_bound: -0.25,
          upper_bound: 0.25,
          name: 'Normal'
        },
        {
          lower_bound: -0.4,
          upper_bound: 0.4,
          name: 'Extreme'
        }
      ]
    },
    Opacity: {
      values: [1],
      options: [
        {
          lower_bound: 0.7,
          upper_bound: 1.0,
          name: 'Discrete'
        },
        {
          lower_bound: 0.4,
          upper_bound: 1.0,
          name: 'Normal'
        },
        {
          lower_bound: 0.1,
          upper_bound: 1.0,
          name: 'Extreme'
        }
      ]
    }
  },
  originalInputs = [
    {
      name: 'Pitch',
      code: 'pitc',
      description: `How high or low a sound is, like a bird's chirp being high and a drum's thud being low.`,
      edit_mode: false,
      output_name: 'None'
    },
    {
      name: 'Loudness',
      code: 'loud',
      description: `How soft or loud a sound is, like whispering quietly or shouting loudly.`,
      edit_mode: false,
      output_name: 'None'
    },
    {
      name: 'Rhythm',
      code: 'dura',
      description: `The pattern of beats and pauses in speech, like the regularity of a heartbeat.`,
      edit_mode: false,
      output_name: 'None'
    },
    {
      name: 'Valence',
      code: 'vale',
      description: `How positive or negative the tone of speech is, indicating emotions like happiness or sadness.`,
      edit_mode: false,
      output_name: 'None'
    },
    {
      name: 'Arousal',
      code: 'arou',
      description: `How intense and emotional speech is, like excitement or calmness in a person's voice.`,
      edit_mode: false,
      output_name: 'None'
    }
  ],
  videoIsLoaded = ref(false),
  tracksAreLoaded = ref(false)

let video, molecule, wordCount, firstX, lines

// https://stackoverflow.com/a/12646864/888094
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
}

shuffle(originalInputs)
let inputs = reactive([...originalInputs]),
  styles = reactive({ ...originalStyles })

/**
 * Extends the Number prototype to map a value from one range to another.
 * Given input and output ranges, this method linearly maps the calling number
 * from the input range to the corresponding value in the output range.
 */
Number.prototype.map = function (in_min, in_max, out_min, out_max) {
  return ((this - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min
}

/**
 * Prepares a video player for caption display, configuring text track settings
 * and handling cue events. The function associates cue enter events with the
 * replacement of text in the designated container (e.g., 'molecule') during
 * video playback. Additionally, it initializes variables for word count,
 * the X-coordinate of the first word, and an array to store lines of text.
 */
function prepareVideoPlayer(video) {
  const videoLoaded = function () {
    if (document.getElementById(`video-track`).readyState >= 2) {
      // sometimes a track load even isn't triggered
      tracksAreLoaded.value = true
    }
    if (!videoIsLoaded.value || !tracksAreLoaded.value) {
      return
    }

    const tracks = video.textTracks[0]
    if (debugCaptionSetup) console.log(`tracks`, tracks)
    tracks.mode = 'hidden'
    const cues = tracks.cues
    if (debugCaptionSetup) console.log(`cues`, cues.length)
    for (let i = 0; i < cues.length; i++) {
      let cue = cues[i]
      cue.onenter = (e) => {
        if (!scrollingCaptions) {
          firstX = calcFirstX()
        }
        if (!video.paused && !video.ended) {
          const duration = e.srcElement.endTime - e.srcElement.startTime
          if (scrollingCaptions) {
            replaceScrollingText(e.srcElement.text, molecule, duration)
          } else {
            replaceBlockText(e.srcElement.text, molecule)
          }
        }
      }
      cue.onexit = cueExit
    }
  }

  const cueExit = function () {
    if (!scrollingCaptions) {
      lines = []
      wordCount = 0
      molecule.innerHTML = ''
    }
  }

  wordCount = 0
  firstX = -1
  lines = []

  const trackEl = document.getElementById('video-track')

  trackEl.addEventListener('load', () => {
    if (debugCaptionSetup)
      console.log(`tracks have loaded...`, document.getElementById(`video-track`).readyState)
    tracksAreLoaded.value = true
    videoLoaded()
  })

  video.addEventListener('loadeddata', () => {
    if (debugCaptionSetup) console.log(`video has loaded...`)
    videoIsLoaded.value = true
    videoLoaded()
  })

  video.addEventListener('ended', () => {
    if (debugCaptionSetup) console.log(`video has ended...`)
    const playButton = document.getElementById('play-button')
    video.pause()
    playButton.innerText = '▶ Play'
  })

  video.load()

  firstX = calcFirstX()
  window.addEventListener('resize', () => {
    console.log('Detect resize')
    firstX = calcFirstX()
  })
}

/**
 Calculates the X-coordinate of the first word in the caption container. A new
 line is created everytime a word is added and has its X-coordinate equal to
 this firstX value. If this happens, we can trigger the line cleaning algorithm
 so as to limit the total number of lines to 2.
 */
const calcFirstX = function () {
  if (debugCaptionSetup) console.log(`will calc FirstX...`)
  let molEl = document.getElementById('molecule')
  let erase = false
  if (!molEl.hasChildNodes()) {
    molEl.innerHTML = `<span class="atom"><span>...</span></span>`
    erase = true
  }

  let rect = molEl.getBoundingClientRect()
  let pad = parseFloat(window.getComputedStyle(molEl, null).getPropertyValue('padding-left'))
  if (erase) {
    molEl.innerHTML = ''
  }

  const firstX = Math.round(rect.x + pad)

  if (debugCaptionSetup) console.log(`firstX`, firstX)

  return firstX
}

/**
 * Resets the state of a video player and associated caption container.
 * Clears stored lines of text, resets word count, empties the caption container,
 * and pauses the video playback.
 *
 */
const resetVideo = function (video, molecule) {
  lines = []
  wordCount = 0
  molecule.innerHTML = ''
  video.pause()
  const playButton = document.getElementById('play-button')
  playButton.innerText = '▶ Play'
}

/**
 * Extracts information from a formatted input string containing a code and
 * a floating-point value.
 * @param {string} input - The formatted input string in the 'CODE_VALUEpVALUE' format.
 * @returns {Array} An array containing the extracted code and floating-point value.
 */
const explodeInput = function (input) {
  // returns input code and floating point value
  return [input.slice(2, 6), parseFloat(input.slice(7).replace('p', '.'))]
}

function processInputs(inputs) {
  const newStyle = {}
  inputs.forEach((input) => {
    let inputVariable, inputValue
    ;[inputVariable, inputValue] = explodeInput(input)

    if (inputVariable in mappedInputs.value) {
      const outputStyle = mappedInputs.value[inputVariable]
      switch (outputStyle) {
        case 'Baseline-shift':
          {
            const i = styles[`Baseline-shift`].values[0],
              minBs = styles['Baseline-shift'].options[i].lower_bound,
              maxBs = styles['Baseline-shift'].options[i].upper_bound
            newStyle[`--baseline-shift`] = `${-1 * (inputValue * (maxBs - minBs) + minBs)}em` // the -1 is because here, going up happens with negative values
            newStyle[`--baseline-shift-line-height`] = `1.8`
          }
          break
        case `Background-color`:
          {
            const colorScale = chroma.scale([
              styles[`Background-color`].values[0],
              '#000000',
              styles[`Background-color`].values[1]
            ])
            newStyle[`--background-color`] = colorScale(inputValue).hex()
          }
          break
        case `Font-color`:
          {
            const colorScale = chroma.scale([
              styles['Font-color'].values[0],
              '#ffffff',
              styles['Font-color'].values[1]
            ])
            newStyle[`--font-color`] = colorScale(inputValue).hex()
          }
          break
        case 'Font-weight':
          {
            const i = styles['Font-weight'].values[0],
              minFw = styles['Font-weight'].options[i].lower_bound,
              maxFw = styles['Font-weight'].options[i].upper_bound
            newStyle[`--font-weight`] = parseInt(inputValue * (maxFw - minFw) + minFw)
          }
          break
        case 'Font-size':
          {
            const i = styles['Font-size'].values[0],
              minFontSize = styles['Font-size'].options[i].lower_bound,
              maxFontSize = styles['Font-size'].options[i].upper_bound
            newStyle[`--font-size-upper-bound`] = `${maxFontSize}rem`
            newStyle[`--font-size`] = `${inputValue * (maxFontSize - minFontSize) + minFontSize}rem`
          }
          break
        case 'Letter-spacing':
          {
            const i = styles['Letter-spacing'].values[0],
              minLs = styles['Letter-spacing'].options[i].lower_bound,
              maxLs = styles['Letter-spacing'].options[i].upper_bound
            newStyle[`--letter-spacing`] = `${inputValue * (maxLs - minLs) + minLs}ch`
          }
          break
        case 'Opacity':
          {
            const i = styles['Opacity'].values[0],
              minOp = styles['Opacity'].options[i].lower_bound,
              maxOp = styles['Opacity'].options[i].upper_bound
            newStyle[`--opacity`] = `${inputValue * (maxOp - minOp) + minOp}`
          }
          break
      }
    }
  })
  return newStyle
}

/**
 * Processes a caption track by extracting input values, applying mappings, and
 * generating styles.
 */
const processScrollingTrack = function (text) {
  let ended = false,
    processedStyles = [],
    inputArray = []

  while (!ended) {
    let inputs, innerText
    ;[inputs, innerText] = extractInputsPlusInnerText(text)

    if (inputs !== null) {
      processedStyles.push(processInputs(inputs))
      inputArray = inputArray.concat(inputs)
      text = innerText
    } else {
      ended = true
    }
  }
  return { text, processedStyles, input_array: inputArray }
}

const processBlockTrack = function (text) {
  text = text.replace(`\n`, `<br>`)
  // Split the string using regular expression to preserve content inside <c> tags
  let splitString = text.split(/(<c[^<]*<\/c>)/)
  // Filter out empty strings caused by spaces between tags
  splitString = splitString.filter(function (item) {
    return item.trim() !== ''
  })

  const words = []
  splitString.forEach((word) => {
    words.push(processScrollingTrack(word))
  })

  return words
}

const extractInputsPlusInnerText = function (text) {
  // extracts input variables and text:
  let iStart = text.indexOf('<c')
  let iEnd = text.indexOf('</c>')

  if (iStart == -1) {
    return [null, null]
  }

  let subS = text.slice(iStart, iEnd)
  let iMid = subS.indexOf('>')
  let inputs = subS.slice(3, iMid).split('.') // array with all input variables
  let innerText = subS.slice(iMid + 1) + ' ' // actual text
  return [inputs, innerText]
}

const replaceBlockText = function (text, parent) {
  const r = processBlockTrack(text)
  r.forEach((word) => {
    if (word.text == `<br>`) {
      const br = document.createElement('br')
      parent.appendChild(br)
      return
    }

    const id = `word-${wordCount}`
    const span = document.createElement('span')
    span.setAttribute(`id`, id)
    span.setAttribute(`class`, `atom`)
    span.innerHTML = `<span>${word.text}</span>`

    word.processedStyles.forEach((s) => {
      for (const [key, value] of Object.entries(s)) {
        span.style.setProperty(key, value)
      }
    })

    inputsArray[id] = word.input_array

    parent.appendChild(span)
    wordCount++
  })
}

const replaceScrollingText = function (text, parent, cueDuration = -1) {
  const r = processScrollingTrack(text)
  const id = `word-${wordCount}`
  const span = document.createElement('span')
  span.setAttribute(`id`, id)
  span.setAttribute(`class`, `atom`)
  span.innerHTML = `<span>${r.text}</span>`

  r.processedStyles.forEach((s) => {
    for (const [key, value] of Object.entries(s)) {
      span.style.setProperty(key, value)
    }
  })

  // saves the inputs for this word
  inputsArray[id] = r.input_array

  parent.appendChild(span)

  let x = Math.round(span.getBoundingClientRect().x)
  if (x == firstX) {
    lines.push(wordCount)
    console.log('detected new line', lines)
    while (lines.length > 2) {
      let from = lines[0],
        to = lines[1]
      for (let i = from; i < to; i++) {
        document.getElementById(`word-${i}`).style.display = 'none'
      }
      lines.shift()
    }
  }

  // if there is a specific tag for duration, it'll use that.
  // if not, and in case there is one available, will
  // use the duration provided by the cue onEnter event.
  if (r.duration == -1 && cueDuration != -1) {
    r.duration = Math.max(0, cueDuration)
  }

  wordCount++
}

function loadVideo() {
  const tracks = document.getElementById(`video-track`)
  video.src = listOfVideos.video_src
  tracks.src = listOfVideos.captions
}

const styleUsage = computed(() => {
  const usedStyles = {}
  inputs.forEach((input, i) => {
    if (input.output_name != 'None') {
      usedStyles[input.output_name] = i
    }
  })
  return usedStyles
})

const mappedInputs = computed(() => {
  const values = {}
  for (const [style, input] of Object.entries(styleUsage.value)) {
    values[inputs[input].code] = style
  }
  return values
})
const log = []
// creates a deep, unreactive copy of the styles object
let oldStyles = JSON.parse(JSON.stringify(styles)),
  oldInputs = JSON.parse(JSON.stringify(inputs))

function updateStyles() {
  if (Object.keys(inputsArray).length === 0) return

  let displayedWords = document.querySelectorAll(`.atom:not([style*="display: none;"])`)
  displayedWords.forEach((word) => {
    word.style = '' // clear previous styles
    const id = word.getAttribute('id')
    const newStyle = processInputs(inputsArray[id])
    for (const [key, value] of Object.entries(newStyle)) {
      word.style.setProperty(key, value)
    }
  })

  // hides all words. the line will be reconstructed word-by-word...
  displayedWords.forEach((word) => {
    word.style.display = 'none'
  })

  // saves the current starting point and how many words
  // were displayed before the line was restyled
  const originalFirstWordIndex = lines[0],
    originalWordCount = displayedWords.length

  // if words will need to be removed, they will be at the
  // start (older), so we'll start from the end (newer)
  const reversedWords = [...displayedWords].reverse()
  let lineCount = 0
  reversedWords.forEach((word) => {
    word.style.display = 'inline-block'
    let x = Math.round(reversedWords[0].getBoundingClientRect().x)
    // every time the last word is shifted to the leftmost position,
    // it means a new line has started. we can only have two lines,
    // so once we have three, we'll undo the new word and stop
    if (x == firstX) {
      lineCount++
    }
    if (lineCount > 2) {
      word.style.display = 'none'
      return
    }
  })

  // the line index array needs to be updated with the new configuration,
  // so we'll clear it and find its (at most) 2 indexes again
  lines = []
  displayedWords = document.querySelectorAll(`.atom:not([style*="display: none;"])`)

  // this offset is necessary because we want the indexes of the first
  // word of each line, and these are actually absolute indexes considering
  // all words, not just the ones that are currently displayed
  const newWordCount = displayedWords.length,
    offset = originalWordCount - newWordCount + originalFirstWordIndex

  displayedWords.forEach((word, i) => {
    let x = Math.round(word.getBoundingClientRect().x)
    if (x == firstX) {
      lines.push(i + offset)
    }
  })
}

watch(inputs, async () => {
  updateStyles()
  for (let i = 0; i < inputs.length; i++) {
    if (inputs[i].output_name != oldInputs[i].output_name) {
      logAction('set_style', {
        input: inputs[i].name,
        old_value: oldInputs[i].output_name,
        new_value: inputs[i].output_name
      })
    }
  }
  oldInputs = JSON.parse(JSON.stringify(inputs))
})

watch(styles, async () => {
  updateStyles()
  Object.keys(styles).every((style) => {
    if (style == 'None') {
      // skip none
      return true
    }
    for (let i = 0; i < styles[style].values.length; i++) {
      // found the difference?
      if (styles[style].values[i] != oldStyles[style].values[i]) {
        // if this is a multidimensional style (colors usually),
        // logs the whole array of values
        if (styles[style].values.length > 1) {
          logAction('tweaked_style', {
            style,
            old_value: oldStyles[style].values,
            new_value: styles[style].values
          })
        } else {
          logAction('tweaked_style', {
            style,
            old_value: oldStyles[style].values[i],
            new_value: styles[style].values[i]
          })
        }
      }
    }
    return true
  })
  // creates a deep, unreactive copy of styles current state,
  // which is what i'll use for comparisons
  oldStyles = JSON.parse(JSON.stringify(styles))
})

function logAction(action, params = {}) {
  log.push({ action, params })
}

function play() {
  const playButton = document.getElementById('play-button')
  if (video.paused) {
    video.play()
    playButton.innerText = '⏸ Pause'
  } else {
    video.pause()
    playButton.innerText = '▶ Play'
  }
}

function rewind() {
  const playButton = document.getElementById('play-button')
  playButton.innerText = '▶ Play'
  resetVideo(video, molecule)
  video.currentTime = 0
}

function toggleEditMode(i) {
  let action
  inputs[i].edit_mode = !inputs[i].edit_mode
  if (inputs[i].edit_mode) {
    action = `Entered edit mode`
  } else {
    action = `Exited edit mode`
  }
  logAction(action, {
    input: inputs[i].name
  })
}

onMounted(() => {
  if (debugCaptionSetup) console.clear()
  video = document.getElementById('player')
  molecule = document.getElementById('molecule')
  loadVideo()
  prepareVideoPlayer(video)
})
</script>

<template>
  <div id="general-container">
    <div id="grid">
      <div id="main-container">
        <main>
          <div id="video-container">
            <video id="player" preload="auto">
              <source type="video/mp4" />
              <track id="video-track" default kind="captions" srclang="en" />
            </video>
            <div id="faux-track">
              <p id="molecule">&#8203;</p>
            </div>
          </div>
          <div id="video-controls">
            <div id="play-controls" v-show="videoIsLoaded && tracksAreLoaded">
              <button id="play-button" class="prim-button secondary" @click="play()">
                ▶ Play
              </button>
              <button id="rewind-button" class="prim-button secondary" @click="rewind()">
                ⏮ Rewind
              </button>
            </div>
          </div>
          <div id="video-credits">
            Video credits:
            <a href="https://vimeo.com/541027933" target="_blank"
              >Camila Ledo Monologue — Far Away</a
            >. Licensed under
            <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank"
              >Creative Commons Attribution 4.0 International (CC BY 4.0)</a
            >
          </div>
        </main>
      </div>
      <aside>
        <h2>
          Elements of speech
          <span class="input-count"
            >{{ Object.entries(mappedInputs).length }}⁄{{ inputs.length }}</span
          >
        </h2>
        <div
          class="input-control"
          v-for="(input, iI) in inputs"
          :key="`input-${iI}`"
          :class="{ 'active-style': input.output_name != `None` }"
        >
          <h3>{{ input.name }}</h3>
          <p class="feature-description">{{ input.description }}</p>
          <div class="output-control" :class="{ 'open-edit': input.edit_mode }">
            <div class="style-display" v-if="!input.edit_mode">
              <h4 @click="toggleEditMode(iI)">
                <span class="material-symbols-outlined">{{
                  materialIcons[input.output_name]
                }}</span>
                {{ input.output_name }}
              </h4>
              <button class="prim-button terciary" @click="toggleEditMode(iI)">
                Change&nbsp;Style
              </button>
            </div>
            <template v-else>
              <div class="style-selection">
                <label :for="`select-${iI}`">Style name</label>
                <select :id="`select-${iI}`" v-model="inputs[iI].output_name" class="custom-select">
                  <option
                    v-for="(style, styleName, iStyle) in styles"
                    :key="`style-${iI}-${iStyle}`"
                    :value="styleName"
                    :disabled="styleName in styleUsage && styleUsage[styleName] != iI"
                  >
                    {{ styleName }}
                  </option>
                </select>
                <div class="style-settings" v-if="input.output_name != 'None'">
                  <template v-if="input.output_name == 'Background-color'">
                    <!-- https://medialab.github.io/iwanthue/ -->

                    <div
                      class="gradient"
                      :style="`--color0: ${styles['Background-color'].values[0]}; --mid-color: #000000; --color1: ${styles['Background-color'].values[1]};`"
                    >
                      <span>Example text</span>
                    </div>
                    <ColorPicker
                      :label="`Negative:`"
                      :colors="styles['Background-color'].options[0]"
                      v-model="styles['Background-color'].values[0]"
                    /><ColorPicker
                      :label="`Positive:`"
                      :colors="styles['Background-color'].options[1]"
                      v-model="styles['Background-color'].values[1]"
                    />
                  </template>
                  <template v-if="input.output_name == 'Baseline-shift'">
                    <div class="discrete-option-list">
                      <div
                        class="discrete-option"
                        v-for="(option, iOption) in styles['Baseline-shift'].options"
                        :key="`bs-opt-key-${iOption}`"
                      >
                        <input
                          type="radio"
                          name="bs-options"
                          :value="iOption"
                          :id="`bs-opt-${iOption}`"
                          v-model="styles['Baseline-shift'].values[0]"
                        /><label :for="`bs-opt-${iOption}`"> {{ option.name }}</label>
                      </div>
                    </div>
                  </template>
                  <template v-if="input.output_name == 'Font-color'">
                    <div
                      class="gradient"
                      :style="`--color0: ${styles['Font-color'].values[0]}; --mid-color: #ffffff; --color1: ${styles['Font-color'].values[1]};`"
                    >
                      &nbsp;
                    </div>
                    <ColorPicker
                      :label="`Negative:`"
                      :colors="styles['Font-color'].options[0]"
                      v-model="styles['Font-color'].values[0]"
                    /><ColorPicker
                      :label="`Positive:`"
                      :colors="styles['Font-color'].options[1]"
                      v-model="styles['Font-color'].values[1]"
                    />
                  </template>
                  <template v-if="input.output_name == 'Font-size'">
                    <div class="discrete-option-list">
                      <div
                        class="discrete-option"
                        v-for="(option, iOption) in styles['Font-size'].options"
                        :key="`fs-opt-key-${iOption}`"
                      >
                        <input
                          type="radio"
                          name="fs-options"
                          :value="iOption"
                          :id="`fs-opt-${iOption}`"
                          v-model="styles['Font-size'].values[0]"
                        /><label :for="`fs-opt-${iOption}`"> {{ option.name }}</label>
                      </div>
                    </div>
                  </template>
                  <template v-if="input.output_name == 'Font-weight'">
                    <div class="discrete-option-list">
                      <div
                        class="discrete-option"
                        v-for="(option, iOption) in styles['Font-weight'].options"
                        :key="`fw-opt-key-${iOption}`"
                      >
                        <input
                          type="radio"
                          name="fw-options"
                          :value="iOption"
                          :id="`fw-opt-${iOption}`"
                          v-model="styles['Font-weight'].values[0]"
                        /><label :for="`fw-opt-${iOption}`"> {{ option.name }}</label>
                      </div>
                    </div>
                  </template>
                  <template v-if="input.output_name == 'Letter-spacing'">
                    <div class="discrete-option-list">
                      <div
                        class="discrete-option"
                        v-for="(option, iOption) in styles['Letter-spacing'].options"
                        :key="`op-opt-key-${iOption}`"
                      >
                        <input
                          type="radio"
                          name="op-options"
                          :value="iOption"
                          :id="`op-opt-${iOption}`"
                          v-model="styles['Letter-spacing'].values[0]"
                        /><label :for="`op-opt-${iOption}`"> {{ option.name }}</label>
                      </div>
                    </div></template
                  >

                  <template v-if="input.output_name == 'Opacity'">
                    <div class="discrete-option-list">
                      <div
                        class="discrete-option"
                        v-for="(option, iOption) in styles['Opacity'].options"
                        :key="`op-opt-key-${iOption}`"
                      >
                        <input
                          type="radio"
                          name="op-options"
                          :value="iOption"
                          :id="`op-opt-${iOption}`"
                          v-model="styles['Opacity'].values[0]"
                        /><label :for="`op-opt-${iOption}`"> {{ option.name }}</label>
                      </div>
                    </div></template
                  >
                </div>
                <button class="prim-button terciary done" @click="toggleEditMode(iI)">Done</button>
              </div>
            </template>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style type="scss">
:root {
  --background-color: transparent;
  --font-size: 1.5rem;
  --font-weight: 400;
  --opacity: 1;
  --baseline-shift: 0px;
  --baseline-shift-line-height: 1.5;
  --font-size-upper-bound: var(--font-size);
  --letter-spacing: 0;

  --font-color: #ffffff;

  --mid-gap: 1rem;

  --features-w: 380px;

  --toolbar-h: 3rem;
  --max-h: calc(100vh - 2rem - var(--toolbar-h));
}

#grid {
  /* https://www.30secondsofcode.org/css/s/nested-border-radius/ */
  border-radius: calc(1rem + 1rem);
  padding: 0 1rem;

  margin: 1rem auto;

  max-height: var(--max-h);

  background-color: #000;

  display: grid;
  grid-template-columns: var(--features-w) var(--video_max_w);
  gap: var(--mid-gap);
  overflow: hidden;

  position: relative;
}

#grid:before,
#grid:after {
  content: '';
  position: absolute;
  left: 0;
  width: calc(var(--features-w) + 2rem);
  height: 1rem;
  z-index: 1;
}

#grid:before {
  top: -1px;
  filter: blur(1px);
  background-image: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.5) 0%,
    rgba(0, 0, 0, 0.33) 33%,
    rgba(0, 0, 0, 0) 100%
  );
}

#grid:after {
  bottom: -1px;
  filter: blur(1px);
  background-image: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.5) 0%,
    rgba(0, 0, 0, 0.33) 33%,
    rgba(0, 0, 0, 0) 100%
  );
}

#main-container {
  grid-column: 2;
  grid-row: 1;
  max-height: calc(var(--max-h) - 1rem);
  overflow-y: scroll;
  width: calc(100% + 1rem);
  padding-right: 1rem;
  padding-top: 1rem;
}

main {
  border-bottom-left-radius: 2rem;
  display: grid;
  grid-template-rows: min-content min-content;
  gap: 1rem;
  padding-bottom: 1rem;
}

#video-controls {
  display: grid;
  grid-template-columns: auto max-content;
  height: var(--video-controls-h);
}

#play-controls,
#video-nav {
  display: flex;
  gap: 0.5rem;
}

#video-emotion {
  display: flex;
  align-items: center;
  gap: 1ch;
}

#video-controls label {
  color: white;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05ch;
}

#video-container {
  background-color: black;
  border-radius: 1rem;
  border: 0.25rem solid #333;
  overflow: hidden;

  margin: auto;
  position: relative;
  max-width: var(--max-video-width);
  width: 100%;

  --faux-track-height: 130px;
  max-height: calc(var(--w) * 9 / 16 + var(--faux-track-height) + 1rem);
  padding-bottom: var(--faux-track-height);
}

video {
  width: 100%;
}

#faux-track {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-image: linear-gradient(to top, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0) 100%);
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  height: var(--faux-track-height);
  border-bottom-right-radius: 1rem;
  border-bottom-left-radius: 1rem;

  display: flex;
  align-items: center;
  justify-content: center;
}

#molecule {
  margin: 0;
  line-height: 1.5;
  padding: 0 1rem;
}

.atom {
  padding: 0.25ch 0.33ch;
  display: inline-block;

  font-weight: var(--font-weight);
  color: var(--font-color);
  background-color: var(--background-color);
  font-size: var(--font-size);
  opacity: var(--opacity);
  letter-spacing: var(--letter-spacing);

  min-height: calc(1.5 * var(--font-size-upper-bound));
  transform: translateY(var(--baseline-shift));
}
.atom span {
  font-family: 'Recursive';
  line-height: var(--baseline-shift-line-height);
}

aside {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: min-content;
  max-height: calc(var(--max-h) - 1rem);
  overflow-y: scroll;
  width: calc(100% + 1rem);
  padding-right: 1rem;
  padding-bottom: 1rem;
  padding-top: 1rem;

  grid-column: 1;
  grid-row: 1;

  position: relative;
}

aside h2 {
  padding: 0 1rem;
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05ch;
}

h2 .input-count {
  font-weight: 400;
  float: right;
  color: #ccc;
}

h3 {
  font-size: 1rem;
}

.input-control {
  background-color: #222;
  border-radius: 1rem;
  padding: 1rem;
}

.input-control:not(.active-style) h3,
.input-control:not(.active-style) .feature-description {
  color: #bbb;
}

.input-control.active-style {
  background: #c0c0c0;
}

.feature-description {
  font-size: 0.9rem;
}

.output-control {
  margin-top: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid transparent;
}

.input-control.active-style .output-control,
.output-control.open-edit {
  background-color: white;
}
.input-control:not(.active-style) .output-control:not(.open-edit) {
  background-color: transparent;
  color: #bbb;
  border-color: #555;
}

.output-control .style-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.output-control h4 {
  font-weight: 400;
}

.output-control .style-display h4 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  cursor: pointer;
}

.output-control .material-symbols-outlined {
  font-size: 1rem;
}

.output-control .style-selection {
  display: grid;
  grid-template-columns: max-content auto;
  gap: 0.5rem;
  align-items: center;
}

.style-settings,
button.done {
  grid-column: 1 / -1;
}

.output-control .style-selection button.done {
  margin-top: 0.75rem;
}

.custom-select {
  padding: 0.125rem;
  border-radius: 0.25rem;
  border-color: gainsboro;
}

.discrete-option-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.discrete-option input {
  display: none;
}

.discrete-option label {
  padding: 0.125rem 0.5rem;
  background-color: #f0f0f1;
  position: relative;
  left: -0.5rem;
  display: block;
  cursor: pointer;
  width: calc(100% + 1rem);
}

.discrete-option input:checked ~ label {
  color: white;
  background-color: #999;
  font-weight: 600;
}

.gradient {
  grid-column: 1 / -1;
  margin-bottom: 0.5rem;
  border-radius: 0.25rem;
  height: 2rem;
  width: 100%;

  background-image: linear-gradient(
    in lab to right,
    var(--color0) 0%,
    var(--color0) 5%,
    var(--mid-color) 47.5%,
    var(--mid-color) 52.5%,
    var(--color1) 95%,
    var(--color1) 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
}
.gradient span {
  color: white;
}

.prim-button:disabled {
  pointer-events: none;
  background-color: black;
  color: darkgray;
  border-color: darkgray;
}

#video-credits,
#video-credits a {
  color: #999;
  font-size: 0.75rem;
}
</style>
