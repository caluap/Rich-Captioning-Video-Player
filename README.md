# CuCap: Rich-Captioning Video Player

_A Vue 3 / Vite implementation for researching customizable affective & prosodic captions_

[**Live demo**](https://cucap.surge.sh/) ・
[**ASSETS ’25 paper**](https://doi.org/10.1145/3663547.3746400)

CuCap lets viewers decide **which speech features** (valence, arousal, loudness, pitch, rhythm) appear in captions **and how** those features map to seven typographic style channels (background-colour, baseline-shift, font-color, font-size, font-weight, opacity, and letter-spacing).  
The system underpins the study reported in our [ASSETS 2025](https://assets25.sigaccess.org/) paper and is released so other researchers can replicate, extend, or audit our work.

---

## Quick start

```bash
git clone https://github.com/caluap/Rich-Captioning-Video-Player.git
cd Rich-Captioning-Video-Player
npm install        # install dependencies
npm run dev        # hot-reload dev server at http://localhost:5173
```

---

## Media Credit

The example file comes from “Camila Ledo Monologue – Far Away” by Camila Ledo.

- Source: [https://vimeo.com/541027933](https://vimeo.com/541027933)
- Licensed under [Creative Commons Attribution (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/)
- No changes were made to the original video.


## Citation

If you use this work, please cite the paper it came from:
```
@inproceedings{DeLacerdaPataca2025CuCap,
  author    = {de Lacerda Pataca, Caluã and Ahn, SooYeon and Yoo, Suhyeon and 
              Kim, JooYeong and Truong, Khai N. and Hong, Jin-Hyuk and 
              Peiris, Roshan L. and Huenerfauth, Matt},
  title     = {CuCap: Comparative Analysis of Customized Captioning between 
              North American and South Korean d/Deaf and Hard-of-Hearing 
              Users},
  booktitle = {Proceedings of the 27th International ACM SIGACCESS Conference 
              on Computers and Accessibility (ASSETS '25)},
  year      = {2025},
  publisher = {Association for Computing Machinery},
  address   = {New York, NY, USA},
  doi       = {10.1145/3663547.3746400},
  isbn      = {979-8-4007-0676-9},
  location  = {Denver, CO, USA},
  pages     = {1--21},
  url       = {https://doi.org/10.1145/3663547.3746400}
}
```
