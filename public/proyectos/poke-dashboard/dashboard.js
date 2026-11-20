let bsDialog

let pokemones = JSON.parse(localStorage.getItem('pokemones')) || []

function guardar () {
    localStorage.setItem('pokemones', JSON.stringify(pokemones))
}

function init () {
    bsDialog = new bootstrap.Dialog('#form-dialog')

    document.querySelector('#btn-agregar')
      .addEventListener('click', () => bsDialog.show())

    document.querySelector('#btn-buscar')
      .addEventListener('click', manejarBusqueda)

    document.querySelector('tbody').addEventListener('click', e => {
        const img = e.target.closest('img')
        if (img) {
            const p = pokemones.find(p => p.name === img.alt)
            mostrarDetalle(p)
            return
        }

        const btn = e.target.closest('.btn-eliminar')
        if (!btn) return

        const id = Number(btn.dataset.id)
        pokemones = pokemones.filter(p => p.id !== id)
        guardar()
        render()
    })

    render()
}

function buscarPokemon (){
    evt.preventDefault()

    let poke = document.querySelector('#matricula').value

    let respuesta = await fetch(`https://pokeapi.co/api/v2/pokemon/${poke}`)
    let data = await respuesta.json()

    document.querySelector('#poke-tittle').value = data.name
    document.querySelector('#poke-img').src = data.sprites.front_default
    document.querySelector('#poke-sound').src = data.cries.latest
    document.querySelector('#poke-sound').play()

    let respuesta2 = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${poke}`)
    let data2 = await respuesta2.json()

    document.querySelector('#entry').value = data2.flavor_text_entries[0].flavor_text

    for (let entry of data2.flavor_text_entries) {
        if (entry.language.name === 'es') {
            document.querySelector('#entry').value = entry.flavor_text
            break
        }
    
}

function obtenerPokemon (query) {
    return fetch(`https://pokeapi.co/api/v2/pokemon/${query}`)
        .then(res => {
            if (!res.ok) throw new Error('No encontrado')
            return res.json()
        })
}

function mostrarDetalle (p) {
    let sonido

    obtenerPokemon(p.id)
        .then(datos => {
            sonido = datos.cries.latest
            return fetch(`https://pokeapi.co/api/v2/pokemon-species/${p.id}/`)
        })
        .then(res => res.json())
        .then(datos => {
            const textos = datos.flavor_text_entries
                .filter(f => f.language.name === 'es')
                .map(f => f.flavor_text.replace(/[\n\f]/g, ' '))

            const descripcion = textos.length
                ? [...new Set(textos)].join(' ')
                : 'Sin descripción en español'

            const dlg = document.createElement('dialog')
            dlg.style.textAlign = 'center'
            dlg.style.maxWidth = '500px'
            dlg.innerHTML = `
                <img src="${p.sprite}" alt="${p.name}" width="128" height="128">
                <h5 style="text-transform: capitalize">${p.name}</h5>
                <p>${descripcion}</p>
                <form method="dialog"><button>Cerrar</button></form>
            `

            const audio = new Audio(sonido)
            dlg.addEventListener('close', () => {
                audio.pause()
                dlg.remove()
            })

            document.body.appendChild(dlg)
            dlg.showModal()
            audio.play()
        })
        .catch(() => alert('No se pudo cargar la información del Pokémon'))
}

function render () {
    document.querySelector('tbody').innerHTML = pokemones.map(p => `
        <tr>
            <td>${p.id}</td>
            <td style="text-transform: capitalize">${p.name}</td>
            <td>
                <img src="${p.sprite}" alt="${p.name}" width="64" height="64">
                <button type="button" class="btn-eliminar" data-id="${p.id}"
                        title="Eliminar" aria-label="Eliminar ${p.name}"
                        style="margin-left: 8px; border: none; background: transparent; color: #dc3545; font-size: 1.1rem; cursor: pointer;">✕</button>
            </td>
        </tr>
    `).join('')
}

function manejarBusqueda () {
    const input = document.querySelector('#inp-search')
    const query = input.value.trim().toLowerCase()

    if (!query) return

    obtenerPokemon(query)
        .then(data => {
            pokemones.push({
                id: data.id,
                name: data.name,
                sprite: data.sprites.front_default
            })

            guardar()
            render()

            input.value = ''
            bsDialog.hide()
        })
        .catch(() => {
            alert('No se encontró ningún Pokémon con ese nombre o número')
        })
}

/** NO MODIFICAR */
window.addEventListener('load', () => {
    import('https://cdn.jsdelivr.net/npm/bootstrap@6.0.0-alpha.1/dist/js/bootstrap.bundle.min.js')
        .then(bootstrap => {
            window.bootstrap = bootstrap

            init()
        })
})