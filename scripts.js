/**
 * Data Catalog Project Starter Code - SEA Stage 2
 *
 * This file is where you should be doing most of your work. You should
 * also make changes to the HTML and CSS files, but we want you to prioritize
 * demonstrating your understanding of data structures, and you'll do that
 * with the JavaScript code you write in this file.
 *
 * The comments in this file are only to help you learn how the starter code
 * works. The instructions for the project are in the README. That said, here
 * are the three things you should do first to learn about the starter code:
 * - 1 - Change something small in index.html or style.css, then reload your
 *    browser and make sure you can see that change.
 * - 2 - On your browser, right click anywhere on the page and select
 *    "Inspect" to open the browser developer tools. Then, go to the "console"
 *    tab in the new window that opened up. This console is where you will see
 *    JavaScript errors and logs, which is extremely helpful for debugging.
 *    (These instructions assume you're using Chrome, opening developer tools
 *    may be different on other browsers. We suggest using Chrome.)
 * - 3 - Add another string to the titles array a few lines down. Reload your
 *    browser and observe what happens. You should see a fourth "card" appear
 *    with the string you added to the array, but a broken image.
 *
 */

let pokemonData = {};
let selectedTypes = []; // maximum 2 types
let selectedGeneration = "";
let typeFilterLogic = "or"; // "or" for "Match Any" (default) or "and" for "Match All"
let currentSortOption = "number-low-high"; // default sort option
let searchQuery = "";

let caughtPokemon = []; // An array of pokemons caught (only the names)
let showCaughtOnly = false; // to show or not show only the pokemons caught

// this function loads data from CSV
function loadData(csvUrl, callback){
  fetch(csvUrl)
    .then(response => {
      if(!response.ok){
        throw new Error(`Failed to load CSV file: ${response.status}`);
      }
      return response.text();
    })
    .then(csvText => {
      const lines = csvText.trim().split('\n');
      const headers = lines[0].split(',').map(header => header.trim());
      const csvData = []; // turn lines into a list of objects
      for(let i = 1; i < lines.length; i++){
        const values = lines[i].split(',').map(value => value.trim());
        const object = {};
        headers.forEach((header, index) => {
          object[header] = values[index]; // assign each value into corresponding header
        });
        csvData.push(object);
      }
      console.log("Pokemon Data:", csvData);
      if(callback){ callback(csvData); }
    })
    .catch(error => {
      console.error("Error loading CSV:", error);
    });
}

// This function removes all nonalphanumerical characters and change to all lowercase.
function normalizeName(name){
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// This function decides if we should display the pokemon or not. Depends on filters present.
function shouldDisplay(pokemon){
  // Checks the search query.
  if(searchQuery && !(pokemon["Name"].toLowerCase().includes(searchQuery.toLowerCase()))){
    return false;
  }

  // If the caughtOnly filter is active, only show pokemons that have already been caught.
  if(showCaughtOnly && !caughtPokemon.includes(pokemon["Name"])){
    return false;
  }

  // Checks the types filter
  if(selectedTypes.length > 0){
    let type1 = pokemon["Type 1"] ? pokemon["Type 1"].toLowerCase() : ""; // is "" if type 1/2 doesn't exist
    let type2 = pokemon["Type 2"] ? pokemon["Type 2"].toLowerCase() : "";

    if(typeFilterLogic === "or"){ // Match Any Filter Logic
      // As long as one of the pokemon types matches one of the selected types
      if (!selectedTypes.some(t => type1.includes(t.toLowerCase()) || type2.includes(t.toLowerCase()))) {
        return false;
      }
    } else if(typeFilterLogic === "and"){ // Match All Filter Logic
      // Only if types of the pokemon strictly match both the selected types.
      if(selectedTypes.length == 1 && !(type1 == "" || type2 == "")){
        return false;
      }
      if(!selectedTypes.every(t => type1.includes(t.toLowerCase()) || type2.includes(t.toLowerCase()))){
        return false;
      }
    }
  }

  // Checks the generation filter
  if(selectedGeneration && parseInt(selectedGeneration, 10) != pokemon["Generation"]){
    return false;
  }

  return true;
}

// This function creates the filterDropdown interface for filtering by types and generations.
function filterDropdownInterface() {
  const filterToggle = document.getElementById("filter-toggle");
  const filterDropdown = document.getElementById("filter-dropdown");

  filterToggle.addEventListener("click", function(){
    // Shows filter dropdown interface.
    if(filterDropdown.style.display === "none" || filterDropdown.style.display === "") {
      filterDropdown.style.display = "block";
    } else {
      filterDropdown.style.display = "none";
    }
  });

  // Type filter options
  const typeFilterOptions = document.querySelectorAll(".filter-option");
  typeFilterOptions.forEach(option => {
    option.addEventListener("click", function(){
      let type = this.getAttribute("data-type"); // eg. Normal, Fire, Water, etc
      if(this.classList.contains("active")){ // deactivate the type
        this.classList.remove("active");
        selectedTypes = selectedTypes.filter(t => t !== type); // remove the deactivated type from selectedTypes
      } else { // activate the type
        if(selectedTypes.length < 2){
          this.classList.add("active");
          selectedTypes.push(type);
        } else {
          // alert("You can only select up to 2 types."); // Max selection limit of 2 types
          // I found alert annoying, or I could make it so..
          // if you select a third type, it will deactivate the first type pressed automatically.
          let firstTypePressed = selectedTypes.shift();
          typeFilterOptions.forEach(option => {
            if(option.getAttribute("data-type") === firstTypePressed) {
              option.classList.remove("active");
            }
          });
          this.classList.add("active");
          selectedTypes.push(type);
        }
      }
      showCards(pokemonData);
    });
  });

  // Type filter logic options
  const matchAnyButton = document.getElementById("match-any");
  const matchAllButton = document.getElementById("match-all");

  if (matchAnyButton && matchAllButton) {
    matchAnyButton.addEventListener("click", function() {
      typeFilterLogic = "or";
      matchAnyButton.classList.add("active");
      matchAllButton.classList.remove("active");
      showCards(pokemonData);
    });
    matchAllButton.addEventListener("click", function() {
      typeFilterLogic = "and";
      matchAllButton.classList.add("active");
      matchAnyButton.classList.remove("active");
      showCards(pokemonData);
    });
  }

  // Generation filter options
  const genFilterOptions = document.querySelectorAll(".generation-option");
  genFilterOptions.forEach(option => {
    option.addEventListener("click", function(){
      let gen = this.getAttribute("data-generation"); // eg. 1,2,etc
      if(this.classList.contains("active")){ // deactivate the generation
        this.classList.remove("active");
        selectedGeneration = "";
      } else { // activate the generation
        genFilterOptions.forEach(option => option.classList.remove("active")); // remove all active status first
        this.classList.add("active");
        selectedGeneration = gen;
      }
      showCards(pokemonData);
    });
  });

  // Reset Button -> resets the filters back to default
  document.getElementById("reset-filter").addEventListener("click", function(){
    selectedTypes = [];
    document.querySelectorAll(".filter-option").forEach(option => option.classList.remove("active"));

    selectedGeneration = "";
    document.querySelectorAll(".generation-option").forEach(option => option.classList.remove("active"));

    typeFilterLogic = "or";
    matchAnyButton.classList.add("active");
    matchAllButton.classList.remove("active");

    showCards(pokemonData);
  });
}

// This function creates sort dropdown functionality
function sortDropdown() {
  const sortSelect = document.getElementById("sort-select");
  if(sortSelect){
    sortSelect.addEventListener("change", function() {
      currentSortOption = this.value;
      showCards(pokemonData);
    });
  }
}

// This function adds cards the page to display the data in the array
function showCards(pokemonData) {
  const cardContainer = document.getElementById("card-container");
  cardContainer.innerHTML = "";
  const templateCard = document.querySelector(".card");

  let localPokemonArray = pokemonData;
  
  // Applying filters set by shouldDisplay
  localPokemonArray = localPokemonArray.filter(pokemon => shouldDisplay(pokemon));

  // If no pokemon satisfies the conditions, show a message.
  if (localPokemonArray.length === 0) {
    cardContainer.innerHTML = '<p class="no-pokemon">Sorry! There is no Pokémon that fits the description!</p>';
    return;
  }
  
  // Sorting based on the current sort option.
  if(currentSortOption === "number-low-high"){
    localPokemonArray.sort((a,b) => a["Number"] - b["Number"]);
  }else if(currentSortOption === "number-high-low"){
    localPokemonArray.sort((a,b) => b["Number"] - a["Number"]);
  }else if(currentSortOption === "alphabetical-a-z"){
    localPokemonArray.sort((a,b) => a["Name"].localeCompare(b["Name"]));
  }else if(currentSortOption === "alphabetical-z-a"){
    localPokemonArray.sort((a,b) => b["Name"].localeCompare(a["Name"]));
  }

  // Creating a card for each Pokémon.
  localPokemonArray.forEach(pokemon => {
    const displayName = pokemon["Name"];
    const type1 = pokemon["Type 1"];
    const type2 = pokemon["Type 2"];
    const number = pokemon["Number"];
    const generation = pokemon["Generation"];
    const imageURL = "pokemon_images/" + normalizeName(displayName) + ".png";
    const nextCard = templateCard.cloneNode(true);
    editCardContent(nextCard, displayName, imageURL, type1, type2, number, generation);
    cardContainer.appendChild(nextCard);
  });
}

function editCardContent(card, newTitle, newImageURL, type1, type2, number, generation) {
  card.style.display = "block";

  const cardHeader = card.querySelector("h2");
  cardHeader.innerHTML = ""; // clearing the header
  const titleSpan = document.createElement("span");
  titleSpan.textContent = newTitle;
  cardHeader.appendChild(titleSpan);

  const cardImage = card.querySelector("img");
  cardImage.src = newImageURL;
  cardImage.alt = newTitle + " Image";

  // Add pokeball icon next to the name if caught.
  if (caughtPokemon.includes(newTitle)) {
    let caughtIcon = document.createElement("img");
    caughtIcon.src = "pokemon_images/pokeballcaught.png";
    caughtIcon.alt = "Pokemon Caught!";
    caughtIcon.title = "You caught this pokemon!";
    caughtIcon.className = "caught-icon";
    cardHeader.appendChild(caughtIcon);
  }

  // Let's declare a type container to put in type spans
  let typesContainer = card.querySelector(".pokemon-types");
  typesContainer.innerHTML = "";
  if(type1){
    const type1Span = document.createElement("span");
    type1Span.classList.add("pokemon-type", "type-" + normalizeName(type1));
    type1Span.textContent = type1;
    typesContainer.appendChild(type1Span);
  }
  if(type2){
    const type2Span = document.createElement("span");
    type2Span.classList.add("pokemon-type", "type-" + normalizeName(type2));
    type2Span.textContent = type2;
    typesContainer.appendChild(type2Span);
  }

  // Let's declare an info container to put in number and generation spans
  let infoContainer = card.querySelector(".pokemon-info");
  infoContainer.innerHTML = "";
  if(number){
    const numberSpan = document.createElement("span");
    numberSpan.className = "pokemon-number";
    numberSpan.textContent = number;
    numberSpan.title = "National Pokédex Number";
    infoContainer.appendChild(numberSpan);
  }
  if(generation){
    const genSpan = document.createElement("span");
    genSpan.className = "pokemon-generation";
    genSpan.textContent = generation;
    genSpan.title = "Generation " + generation;
    infoContainer.appendChild(genSpan);
  }

  // You can use console.log to help you debug!
  console.log("New pokemon:", newTitle, "- html: ", card);
}



// --------
// DOMContentLoadings

// When ready, load data and initialize functionality.
document.addEventListener("DOMContentLoaded", () => {
  loadData("pokemon_dataset.csv", function(csvData) {
    pokemonData = csvData;
    showCards(pokemonData);
    filterDropdownInterface();
    sortDropdown();
  });
});

// Reading for search query input.
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("search");
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      searchQuery = this.value.trim();
      showCards(pokemonData);
    });
  }
});

// When pokeball is pressed, corresponding catch mode is activated.
document.addEventListener("DOMContentLoaded", () => {
  const pokeballButton = document.getElementById("pokeball-button");
  const masterballButton = document.getElementById("masterball-button");

  // Regular Pokeball Check
  if(pokeballButton){
    pokeballButton.addEventListener("click", () => { 
      pokeballButton.classList.add("active"); // activating pokeball
      if(masterballButton){
        masterballButton.classList.remove("active");
      }
      console.log("Regular Pokemon Catch Mode Activated!");
    });
  }

  // Masterball Check
  if(masterballButton){
    masterballButton.addEventListener("click", () => {
      masterballButton.classList.add("active"); // activating masterball
      if(pokeballButton){
        pokeballButton.classList.remove("active");
      }
      console.log("Master Pokemon Catch Mode Activated!");
    });
  }
});

// Listen for any clicks, in case a catch mode is active.
document.addEventListener("click", (e) => {
  const isRegularCatchMode = document.getElementById("pokeball-button").classList.contains("active");
  const isMasterCatchMode = document.getElementById("masterball-button").classList.contains("active");

  if(!isRegularCatchMode && !isMasterCatchMode){ return; } // stop if none is active

  const card = e.target.closest(".card"); // find the closest card to catch pokemon

  if(card && card.style.display !== "none"){
    const cardHeader = card.querySelector("h2");
    let pokemonName = cardHeader.textContent;
    const pokemon = pokemonData.find(p => p["Name"] === pokemonName);

    if(pokemon){
      let catchRate = Number(pokemon["Catch Rate"]);
      let probability = catchRate/255;
      let randomNum = Math.random();
      let message = "";

      // Master catch mode gurantees success (100% CR)
      if(isMasterCatchMode){
        randomNum = 0;
      }
      if(randomNum < probability){
        // It's a success!
        if(!caughtPokemon.includes(pokemonName)){
          caughtPokemon.push(pokemonName);
        }
        if(isMasterCatchMode){ //if caught due to masterball
          message = `You caught ${pokemonName}! Your success rate is 100% with Masterball!`;
        }else{
          message = `You caught ${pokemonName}! The success probability was ${Math.round(probability*100)}%.`;
        }
        // Put a caught pokeball icon next on the card
        let caughtIcon = document.createElement("img");
        caughtIcon.src = "pokemon_images/pokeballcaught.png";
        caughtIcon.alt = "Pokemon Caught!";
        caughtIcon.title = "You caught this pokemon!";
        caughtIcon.className = "caught-icon";
        cardHeader.appendChild(caughtIcon);
      } else {
        // It's a failure!
        message = `${pokemonName} ran away! The success probability was ${Math.round(probability*100)}%.`;
      }
      alert(message);
    } else {
      // pokemon doesn't exist
      alert(`${pokemonName}'s data doesn't exist!`);
    }

    // Turn off all the catch modes
    document.getElementById("pokeball-button").classList.remove("active");
    document.getElementById("masterball-button").classList.remove("active");
  }
});

// To show or not show caught pokemon only.
document.addEventListener("DOMContentLoaded", () => {
  const caughtToggle = document.getElementById("caught-toggle");
  if(caughtToggle){
    caughtToggle.addEventListener("click", function(){
      showCaughtOnly = !showCaughtOnly;
      if(showCaughtOnly){
        this.classList.add("active");
      }else{
        this.classList.remove("active");
      }
      showCards(pokemonData);
    });
  }
});

// Handling the instruction modal.
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("instruction-modal");
  const closeButton = document.getElementById("modal-close");

  modal.style.display = "block";

  // When the user clicks on the close button, hide the modal.
  closeButton.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // When the user clicks anywhere else outside the modal, hide it.
  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });
});
