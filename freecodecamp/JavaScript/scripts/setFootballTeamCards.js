'use strict';

const footballTeam = {
    team: 'France',
    year: 2018,
    headCoach: 'Didier Deschamps',
    players: [{
            name: 'Hugo Lloris',
            position: 'goalkeeper',
            isCaptain: true
        }, {
            name: 'Steve Mandanda',
            position: 'goalkeeper',
            isCaptain: false
        }, {
            name: 'Alphonse Areola',
            position: 'goalkeeper',
            isCaptain: false
        }, {
            name: 'Dijibril Sidibé', 
            position: 'defender',
            isCaptain: false
        }, {
            name: 'Benjamin Pavard',
            position: 'defender',
            isCaptain: false
        }, {
            name: 'Adil Rami',
            position: 'defender',
            isCaptain: false
        }, {
            name: 'Raphaël Varane',
            position: 'defender',
            isCaptain: false
        }, {
            name: 'Samuel Umtiti',
            position: 'defender',
            isCaptain: false
        }, {
            name: 'Presnel Kimpembe',
            position: 'defender',
            isCaptain: false
        }, {
            name: 'Benjamin Mendy',
            position: 'defender',
            isCaptain: false
        }, {
            name: 'Lucas Hernandez',
            position: 'defender',
            isCaptain: false
        }, {
            name: 'Paul Pogba',
            position: 'midfielder',
            isCaptain: false
        }, {
            name: 'Blaise Matuidi',
            position: 'midfielder',
            isCaptain: false
        }, {
            name: 'Corentin Tolisso',
            position: 'midfielder',
            isCaptain: false
        }, {
            name: "N'Golo Kanté",
            position: 'midfielder',
            isCaptain: false
        }, {
            name: 'Steven Nzonzi',
            position: 'midfielder',
            isCaptain: false
        }, {
            name: 'Kylian Mbappé',
            position: 'forward',
            isCaptain: false
        }, {
            name: 'Olivier Giroud',
            position: 'forward',
            isCaptain: false
        }, {
            name: 'Antoine Griezmann',
            position: 'forward',
            isCaptain: false
        }, {
            name: 'Ousmane Dembélé',
            position: 'forward',
            isCaptain: false
        }, {
            name: 'Florian Thauvin',
            position: 'forward',
            isCaptain: false
        }, {
            name: 'Thomas Lemar',
            position: 'forward',
            isCaptain: false
        }, {
            name: 'Nabil Fekir',
            position: 'forward',
            isCaptain: false
        }
    ]};
   
    const select = document.getElementById("players");
    const playerCards = document.querySelectorAll('.player-card');
    const hideout = document.getElementById("hideout");
    const cardHome = document.getElementById('player-cards');

function getPlayerCards (startPosition) {
    console.log(startPosition);
    const position = startPosition.replaceAll('Position: ', "");
    const hidingDivs = document.querySelectorAll('.hidden');
    for (let div of hidingDivs) {
        div.classList.remove("hidden");
        div.classList.add("player-card");
        cardHome.append(div);
    }

if (startPosition !== 'all') {    
for (let playerCard of playerCards) {
 if (!playerCard.innerText.includes(position)) {
    playerCard.classList.remove("player-card");
    playerCard.classList.add("hidden");
    hideout.append(playerCard);
            }  
        }
    }
}

select.addEventListener("change", () => {
  getPlayerCards(select.value);
});

