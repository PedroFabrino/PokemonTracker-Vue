// Sample Pokemon data for testing the interface
export const samplePokemon = [
  {
    id: 1,
    name: "bulbasaur",
    sprites: {
      front_default: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png",
      other: {
        "official-artwork": {
          front_default: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png"
        }
      }
    },
    types: [
      { type: { name: "grass" } },
      { type: { name: "poison" } }
    ],
    height: 7,
    weight: 69,
    base_experience: 64,
    abilities: [
      { ability: { name: "overgrow" }, is_hidden: false },
      { ability: { name: "chlorophyll" }, is_hidden: true }
    ],
    stats: [
      { base_stat: 45, stat: { name: "hp" } },
      { base_stat: 49, stat: { name: "attack" } },
      { base_stat: 49, stat: { name: "defense" } },
      { base_stat: 65, stat: { name: "special-attack" } },
      { base_stat: 65, stat: { name: "special-defense" } },
      { base_stat: 45, stat: { name: "speed" } }
    ],
    species: {
      name: "bulbasaur",
      url: "https://pokeapi.co/api/v2/pokemon-species/1/"
    }
  },
  {
    id: 2,
    name: "ivysaur",
    sprites: {
      front_default: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/2.png",
      other: {
        "official-artwork": {
          front_default: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/2.png"
        }
      }
    },
    types: [
      { type: { name: "grass" } },
      { type: { name: "poison" } }
    ],
    height: 10,
    weight: 130,
    base_experience: 142,
    abilities: [
      { ability: { name: "overgrow" }, is_hidden: false },
      { ability: { name: "chlorophyll" }, is_hidden: true }
    ],
    stats: [
      { base_stat: 60, stat: { name: "hp" } },
      { base_stat: 62, stat: { name: "attack" } },
      { base_stat: 63, stat: { name: "defense" } },
      { base_stat: 80, stat: { name: "special-attack" } },
      { base_stat: 80, stat: { name: "special-defense" } },
      { base_stat: 60, stat: { name: "speed" } }
    ],
    species: {
      name: "ivysaur",
      url: "https://pokeapi.co/api/v2/pokemon-species/2/"
    }
  },
  {
    id: 3,
    name: "venusaur",
    sprites: {
      front_default: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/3.png",
      other: {
        "official-artwork": {
          front_default: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/3.png"
        }
      }
    },
    types: [
      { type: { name: "grass" } },
      { type: { name: "poison" } }
    ],
    height: 20,
    weight: 1000,
    base_experience: 263,
    abilities: [
      { ability: { name: "overgrow" }, is_hidden: false },
      { ability: { name: "chlorophyll" }, is_hidden: true }
    ],
    stats: [
      { base_stat: 80, stat: { name: "hp" } },
      { base_stat: 82, stat: { name: "attack" } },
      { base_stat: 83, stat: { name: "defense" } },
      { base_stat: 100, stat: { name: "special-attack" } },
      { base_stat: 100, stat: { name: "special-defense" } },
      { base_stat: 80, stat: { name: "speed" } }
    ],
    species: {
      name: "venusaur",
      url: "https://pokeapi.co/api/v2/pokemon-species/3/"
    }
  },
  {
    id: 4,
    name: "charmander",
    sprites: {
      front_default: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png",
      other: {
        "official-artwork": {
          front_default: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/4.png"
        }
      }
    },
    types: [
      { type: { name: "fire" } }
    ],
    height: 6,
    weight: 85,
    base_experience: 62,
    abilities: [
      { ability: { name: "blaze" }, is_hidden: false },
      { ability: { name: "solar-power" }, is_hidden: true }
    ],
    stats: [
      { base_stat: 39, stat: { name: "hp" } },
      { base_stat: 52, stat: { name: "attack" } },
      { base_stat: 43, stat: { name: "defense" } },
      { base_stat: 60, stat: { name: "special-attack" } },
      { base_stat: 50, stat: { name: "special-defense" } },
      { base_stat: 65, stat: { name: "speed" } }
    ],
    species: {
      name: "charmander",
      url: "https://pokeapi.co/api/v2/pokemon-species/4/"
    }
  },
  {
    id: 5,
    name: "charmeleon",
    sprites: {
      front_default: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/5.png",
      other: {
        "official-artwork": {
          front_default: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/5.png"
        }
      }
    },
    types: [
      { type: { name: "fire" } }
    ],
    height: 11,
    weight: 190,
    base_experience: 142,
    abilities: [
      { ability: { name: "blaze" }, is_hidden: false },
      { ability: { name: "solar-power" }, is_hidden: true }
    ],
    stats: [
      { base_stat: 58, stat: { name: "hp" } },
      { base_stat: 64, stat: { name: "attack" } },
      { base_stat: 58, stat: { name: "defense" } },
      { base_stat: 80, stat: { name: "special-attack" } },
      { base_stat: 65, stat: { name: "special-defense" } },
      { base_stat: 80, stat: { name: "speed" } }
    ],
    species: {
      name: "charmeleon",
      url: "https://pokeapi.co/api/v2/pokemon-species/5/"
    }
  },
  {
    id: 6,
    name: "charizard",
    sprites: {
      front_default: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png",
      other: {
        "official-artwork": {
          front_default: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png"
        }
      }
    },
    types: [
      { type: { name: "fire" } },
      { type: { name: "flying" } }
    ],
    height: 17,
    weight: 905,
    base_experience: 267,
    abilities: [
      { ability: { name: "blaze" }, is_hidden: false },
      { ability: { name: "solar-power" }, is_hidden: true }
    ],
    stats: [
      { base_stat: 78, stat: { name: "hp" } },
      { base_stat: 84, stat: { name: "attack" } },
      { base_stat: 78, stat: { name: "defense" } },
      { base_stat: 109, stat: { name: "special-attack" } },
      { base_stat: 85, stat: { name: "special-defense" } },
      { base_stat: 100, stat: { name: "speed" } }
    ],
    species: {
      name: "charizard",
      url: "https://pokeapi.co/api/v2/pokemon-species/6/"
    }
  },
  {
    id: 7,
    name: "squirtle",
    sprites: {
      front_default: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png",
      other: {
        "official-artwork": {
          front_default: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/7.png"
        }
      }
    },
    types: [
      { type: { name: "water" } }
    ],
    height: 5,
    weight: 90,
    base_experience: 63,
    abilities: [
      { ability: { name: "torrent" }, is_hidden: false },
      { ability: { name: "rain-dish" }, is_hidden: true }
    ],
    stats: [
      { base_stat: 44, stat: { name: "hp" } },
      { base_stat: 48, stat: { name: "attack" } },
      { base_stat: 65, stat: { name: "defense" } },
      { base_stat: 50, stat: { name: "special-attack" } },
      { base_stat: 64, stat: { name: "special-defense" } },
      { base_stat: 43, stat: { name: "speed" } }
    ],
    species: {
      name: "squirtle",
      url: "https://pokeapi.co/api/v2/pokemon-species/7/"
    }
  },
  {
    id: 8,
    name: "wartortle",
    sprites: {
      front_default: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/8.png",
      other: {
        "official-artwork": {
          front_default: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/8.png"
        }
      }
    },
    types: [
      { type: { name: "water" } }
    ],
    height: 10,
    weight: 225,
    base_experience: 142,
    abilities: [
      { ability: { name: "torrent" }, is_hidden: false },
      { ability: { name: "rain-dish" }, is_hidden: true }
    ],
    stats: [
      { base_stat: 59, stat: { name: "hp" } },
      { base_stat: 63, stat: { name: "attack" } },
      { base_stat: 80, stat: { name: "defense" } },
      { base_stat: 65, stat: { name: "special-attack" } },
      { base_stat: 80, stat: { name: "special-defense" } },
      { base_stat: 58, stat: { name: "speed" } }
    ],
    species: {
      name: "wartortle",
      url: "https://pokeapi.co/api/v2/pokemon-species/8/"
    }
  },
  {
    id: 9,
    name: "blastoise",
    sprites: {
      front_default: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/9.png",
      other: {
        "official-artwork": {
          front_default: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/9.png"
        }
      }
    },
    types: [
      { type: { name: "water" } }
    ],
    height: 16,
    weight: 855,
    base_experience: 268,
    abilities: [
      { ability: { name: "torrent" }, is_hidden: false },
      { ability: { name: "rain-dish" }, is_hidden: true }
    ],
    stats: [
      { base_stat: 79, stat: { name: "hp" } },
      { base_stat: 83, stat: { name: "attack" } },
      { base_stat: 100, stat: { name: "defense" } },
      { base_stat: 85, stat: { name: "special-attack" } },
      { base_stat: 105, stat: { name: "special-defense" } },
      { base_stat: 78, stat: { name: "speed" } }
    ],
    species: {
      name: "blastoise",
      url: "https://pokeapi.co/api/v2/pokemon-species/9/"
    }
  },
  {
    id: 10,
    name: "caterpie",
    sprites: {
      front_default: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/10.png",
      other: {
        "official-artwork": {
          front_default: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10.png"
        }
      }
    },
    types: [
      { type: { name: "bug" } }
    ],
    height: 3,
    weight: 29,
    base_experience: 39,
    abilities: [
      { ability: { name: "shield-dust" }, is_hidden: false },
      { ability: { name: "run-away" }, is_hidden: true }
    ],
    stats: [
      { base_stat: 45, stat: { name: "hp" } },
      { base_stat: 30, stat: { name: "attack" } },
      { base_stat: 35, stat: { name: "defense" } },
      { base_stat: 20, stat: { name: "special-attack" } },
      { base_stat: 20, stat: { name: "special-defense" } },
      { base_stat: 45, stat: { name: "speed" } }
    ],
    species: {
      name: "caterpie",
      url: "https://pokeapi.co/api/v2/pokemon-species/10/"
    }
  },
  {
    id: 25,
    name: "pikachu",
    sprites: {
      front_default: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png",
      other: {
        "official-artwork": {
          front_default: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png"
        }
      }
    },
    types: [
      { type: { name: "electric" } }
    ],
    height: 4,
    weight: 60,
    base_experience: 112,
    abilities: [
      { ability: { name: "static" }, is_hidden: false },
      { ability: { name: "lightning-rod" }, is_hidden: true }
    ],
    stats: [
      { base_stat: 35, stat: { name: "hp" } },
      { base_stat: 55, stat: { name: "attack" } },
      { base_stat: 40, stat: { name: "defense" } },
      { base_stat: 50, stat: { name: "special-attack" } },
      { base_stat: 50, stat: { name: "special-defense" } },
      { base_stat: 90, stat: { name: "speed" } }
    ],
    species: {
      name: "pikachu",
      url: "https://pokeapi.co/api/v2/pokemon-species/25/"
    }
  },
  {
    id: 150,
    name: "mewtwo",
    sprites: {
      front_default: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/150.png",
      other: {
        "official-artwork": {
          front_default: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png"
        }
      }
    },
    types: [
      { type: { name: "psychic" } }
    ],
    height: 20,
    weight: 1220,
    base_experience: 340,
    abilities: [
      { ability: { name: "pressure" }, is_hidden: false },
      { ability: { name: "unnerve" }, is_hidden: true }
    ],
    stats: [
      { base_stat: 106, stat: { name: "hp" } },
      { base_stat: 110, stat: { name: "attack" } },
      { base_stat: 90, stat: { name: "defense" } },
      { base_stat: 154, stat: { name: "special-attack" } },
      { base_stat: 90, stat: { name: "special-defense" } },
      { base_stat: 130, stat: { name: "speed" } }
    ],
    species: {
      name: "mewtwo",
      url: "https://pokeapi.co/api/v2/pokemon-species/150/"
    }
  }
];
