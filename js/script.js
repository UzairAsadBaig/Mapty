'use strict';

// ------------------ Dom Element ------------------
const mapBox = document.querySelector('#mapBox');
const form = document.querySelector('form');
const inputType = document.querySelector('select');
const choice = document.querySelectorAll('.choice');
const type = document.querySelector('select')
const distance = document.querySelector('.distance');
const duration = document.querySelector('.duration');
const cadence = document.querySelector('.cadence');
const elevation = document.querySelector('.elevation');
const formList = document.querySelector('#formList');
const upArrow = document.querySelector('.upArrow');
const downArrow = document.querySelector('.downArrow');
const sBtn = document.querySelector('.sBtn');


// ------------------ Objects ------------------

//---------App Class---------

class App {

    //Private variables
    #map;
    #currentClick;
    #workouts = [];
    // Class constructor that is executed when an app object is created 
    constructor() {
        this._getCurrentPosition();
        this._changeInput();
        this._newWorkout();
    }


    // To get current position
    _getCurrentPosition() {
        navigator.geolocation.getCurrentPosition(function (location) {
            const { longitude, latitude } = location.coords;
            this.#map = L.map('mapBox').setView([latitude, longitude], 15);
            this._loadMap();
        }.bind(this));

    }

    // To load map when the page is loaded
    _loadMap() {
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);

        this.#map.on('click', function (ev) {
            this.#currentClick = ev.latlng;
            this._unHideForm();
        }.bind(this));

        if (localStorage.getItem('workouts'))
            this._getFromLocalStorage();

        this._movToWorkoutMarker();
        this._activeUpDown();
    }


    // To show form
    _unHideForm = () => {
        form.classList.remove('hidden');
        distance.focus();
    }

    //To hide form
    _hideForm = () => {
        form.classList.add('hidden');
        distance.blur();
    };

    // Change input type 
    _changeInput = () => {
        inputType.addEventListener('change', function () {
            choice.forEach(each => each.classList.toggle('hidden'));
        });
    };

    //Add new workout
    _newWorkout() {
        const func = function (e) {
            e.preventDefault();
            const emptyForm = () => distance.value = duration.value = cadence.value = elevation.value = '';
            let workout;
            const { lat, lng } = this.#currentClick;
            if (type.value == 'running')
                workout = new Running([lat, lng], distance.value, duration.value, cadence.value);
            else
                workout = new Cycling([lat, lng], distance.value, duration.value, elevation.value);
            if (workout.validateInput()) {
                this.#workouts.push(workout);
                this._showPopUp(workout)
                this._outputWorkout(workout);
                this._addToLocalStorage();
                this._hideForm();
                emptyForm();
            }
            else {
                alert('Enter a positive integer')
                distance.focus();
                emptyForm();
            }

        }.bind(this);
        // form.addEventListener('keypress', func);
        sBtn.addEventListener('click', func);
    }

    //Shows popup according to workout data
    _showPopUp(workout) {
        L.marker(workout.coords).addTo(this.#map)
            .bindPopup(L.popup({ 'autoClose': false, 'closeOnClick': false, 'className': `popUp${workout.type[0]}`, }))
            .openPopup().setPopupContent(workout.description);
    }



    //Shows the workout details on the formBox
    _outputWorkout(workout) {
        const htmlToAdd = `
        <div class="row output output${workout.type[0]}" data-set="${workout.id}">
                            <div class="col-12">
                                <h2 id="outputHeading">${workout.description.slice(6)}</h2>
                            </div>
                            <div class="col-3 outputCol">${workout.type == 'Running' ? '🏃‍♂️' : '🚴‍♀️'}
                            ${workout.distance}
                                <span class="unit">KM</span>
                            </div>
                            <div class="col-3 outputCol">⏱
                                ${workout.duration}
                                <span class="unit">MIN</span>
                            </div>
                            <div class="col-3 outputCol ">
                                ⚡️
                                ${workout.type == 'Running' ? workout.pace.toFixed(1) : workout.speed.toFixed(1)}
                                <span class="unit">${workout.type == 'Running' ? 'MIN/KM' : 'KM/H'}</span>
                            </div>
                            <div class="col-3 outputCol outputChoice">${workout.type == 'Running' ? '🦶🏼' : '⛰'}
                            ${workout.type == 'Running' ? workout.cadence : workout.elevation}
                                <span class="unit"> ${workout.type == 'Running' ? 'SKM' : 'M'}</span>
                            </div>
                        </div>
        `;

        form.insertAdjacentHTML('afterend', htmlToAdd);
    }

    //Save your workout in local storage
    _addToLocalStorage() {
        localStorage.setItem('workouts', JSON.stringify(this.#workouts));
    }

    //Get saved workout from local storage and display it 
    _getFromLocalStorage() {
        this.#workouts = JSON.parse(localStorage.getItem('workouts'));
        this.#workouts.forEach(function (workout) {
            this._showPopUp(workout);
            this._outputWorkout(workout);

        }.bind(this));
    }

    //Moves to the location of desired workout on the map by clicking on list
    _movToWorkoutMarker() {
        formList.addEventListener('click', function (e) {
            const workoutID = e.target.closest('.output')?.dataset.set;
            if (!workoutID) return;
            const workout = this.#workouts.find(work => work.id === workoutID);
            this.#map.setView(workout.coords, 15, {
                "animate": true,
                "pan": {
                    "duration": 1,
                }
            });
        }.bind(this))
    }

    _activeUpDown() {
        upArrow.addEventListener('click', function (e) {
            e.preventDefault();
            form.scrollIntoView({ behavior: 'smooth' });
        })
        downArrow.addEventListener('click', function (e) {
            e.preventDefault();
            mapBox.scrollIntoView({ behavior: 'smooth' });
        })
    }

}


//---------Workout Class---------
class Workout {
    date = new Date();
    id = (Date.now() + '').slice(-10);

    constructor(coords, distance, duration) {
        this.coords = coords;
        this.distance = +distance;
        this.duration = +duration;
    }

    //Validate if numer is integer
    _inputIsNumber(...inputs) {
        return inputs.every(e => Number.isFinite(e));
    }

    //Validate if numer is positive
    _inputIsPositive(...inputs) {
        return inputs.every(e => e > 0);
    }

    //Generate the month
    _monthGenerator(num) {
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        return months[num];
    }

    //Set Description
    _createDescription() {
        this.description = `${this.type == 'Running' ? '🏃‍♂️' : '🚴‍♀️'} ${this.type} on ${this._monthGenerator(this.date.getMonth())} ${this.date.getDate()}`;
    }


}

class Running extends Workout {
    type = 'Running';
    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = +cadence;
        this._createDescription();
        this._calculatePace();
    }

    //Validate Input
    validateInput() {
        if (!this._inputIsNumber(this.distance, this.duration, this.cadence) || !this._inputIsPositive(this.distance, this.duration, this.cadence)) return false;
        else
            return true;
    }

    //Calculate Pace 
    _calculatePace() {
        this.pace = this.duration / this.distance;
    }

}

class Cycling extends Workout {
    type = 'Cycling';
    constructor(coords, distance, duration, elevation) {
        super(coords, distance, duration);
        this.elevation = +elevation;
        this._createDescription();
        this._calculateSpeed();
    }

    validateInput() {
        if (!this._inputIsNumber(this.distance, this.duration, this.elevation) || !this._inputIsPositive(this.distance, this.duration)) return alert('Enter a positive integer');
        else
            return true;
    }

    //Calculate Speed 
    _calculateSpeed() {
        this.speed = this.distance / (this.duration / 60);
    }
}




// ------------------ Main ------------------
const app = new App();
































// ------------------ Events ------------------
// let map;
// let currentClick;
// navigator.geolocation.getCurrentPosition(function (location) {
//     const { longitude, latitude } = location.coords;
//     const coords = [latitude, longitude];
//     map = L.map('mapBox').setView(coords, 15);

//     L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//         attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//     }).addTo(map);

//     map.on('click', function (ev) {
//         currentClick = ev.latlng;
//         unHideForm();
//     });

// }, function () {
//     alert('Location not found');
// });


// form.addEventListener('keypress', function (e) {
//     if (e.key == 'Enter') {
//         const { lat, lng } = currentClick;
//         L.marker([lat, lng]).addTo(map)
//             .bindPopup(L.popup({ 'autoClose': false, 'closeOnClick': false, 'className': 'popUpR', }))
//             .openPopup().setPopupContent('🏃‍♂️ Running on August 11');
//         hideForm();
//     }
// })

// inputType.addEventListener('change', function () {
//     choice.forEach(each => each.classList.toggle('hidden'));
// })