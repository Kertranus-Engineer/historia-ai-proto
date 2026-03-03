export const eventos = [
{
texto: "Encuentras un artefacto enterrado.",
efecto: (estado) => {
estado.misterio += 2;
estado.valor += 1;
}
},

{
texto: "Una criatura te observa desde lejos.",
efecto: (estado) => {
estado.tension += 2;
}
},

{
texto: "Descubres un refugio abandonado.",
efecto: (estado) => {
estado.salud += 1;
}
},

{
texto: "Una señal desconocida aparece en tu radar.",
efecto: (estado) => {
estado.misterio += 1;
estado.tension += 1;
}
}
]
