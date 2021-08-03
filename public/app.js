document.addEventListener('DOMContentLoaded',()=>{
    const userGrid = document.querySelector('.grid-user')
    const computerGrid = document.querySelector('.grid-computer')
    const displayGrid = document.querySelector('.grid-display')
    const ships = document.querySelectorAll('.ship')
    const destroyer = document.querySelector('.destroyer-container')
    const submarine = document.querySelector('.submarine-container')
    const crusier = document.querySelector('.cruiser-container')
    const battleship = document.querySelector('.battleship-container')
    const carrier = document.querySelector('.carrier-container')
    const StartButton = document.querySelector('#start')
    const rotateButton = document.querySelector('#rotate')
    const turnDisplay = document.querySelector('#whose-go')
    const infoDisplay = document.querySelector('#info')
    const singlePlayerButton = document.querySelector('#singlePlayerButton')
    const multiPlayerButton = document.querySelector('#multiPlayerButton')
    const userSquares = []
    const computerSquares = []
    let isHorizontal = true
    let isGameOver = false
    let currentPlayer = 'user'
    const width = 10
    let gameMode = ""
    let playerNum = 0
    let ready = false
    let enemyReady = false
    let allShipsPlaced = false
    let shotFired = -1

    //select player mode
    singlePlayerButton.addEventListener('click', startSinglePlayer)
    multiPlayerButton.addEventListener('click', startMultiPlayer)

    // multiplayer
    function startMultiPlayer() {
        gameMode = 'multiPlayer'

        const socket = io()

        socket.on('player-number', num =>{
            if (num === -1) {
                infoDisplay.innerHTML = "Sorry, the serever is full"
            } else {
                playerNum = parseInt(num)
                if (playerNum === 1) currentPlayer = "enemy"

                console.log(playerNum)

                //get other palyser status
                socket.emit('check-players')
            }
        })


        //another has connected or disconnected
        socket.on('player-connection', num =>{
            console.log(`player number ${num} has connected or disconnected`)
            playerConnectedOrDisconnected(num)
        })

        socket.on('enemy-ready', num =>{
            enemyReady = true
            playerReady(num)
            if(ready) playgameMulti(socket)
        })

        //check player status
        socket.on('check-players', players=>{
            players.forEach((p,i) =>{
                if(p.connected) playerConnectedOrDisconnected(i)
                if(p.ready) {
                    playerReady(i)
                    if(i!== playerReady) enemyReady = true
                }
            })
        })

        // time out
        socket.on('timeout', ()=>{
            infoDisplay.innerHTML = 'yout have reached the 10minute limit'
        })


        //ready buttom click
        StartButton.addEventListener('click', ()=>{
            if (allShipsPlaced) playgameMulti(socket)
            else infoDisplay.innerHTML = "pleasse place all ships"
            
        })

        computerSquares.forEach(square =>{
            square.addEventListener('click', ()=>{
                if(currentPlayer === 'user' && ready && enemyReady) {
                    shotFired = square.dataset.id
                    socket.emit('fire', shotFired)
                }
            })
        })

        socket.on('fire', id =>{
            enemyGo(id)
            const square = userSquares[id]
            socket.emit('fire-reply', square.classList)
            playgameMulti(socket)
        })

        socket.on('fire-reply', classList =>{
            revealSquare(classList)
            playgameMulti(socket)
        })

        function playerConnectedOrDisconnected(num) {
            let player = `.p${parseInt(num) + 1}`
            document.querySelector(`${player} .connected span`).classList.toggle('green')
            if (parseInt(num) === playerNum) document.querySelector(player).style.fontweight = 'bold'
        }
    }

    //single player
    function startSinglePlayer(){
        gameMode = "singlePlayer"

        generate(shipArray[0])
        generate(shipArray[1])
        generate(shipArray[2])
        generate(shipArray[3])
        generate(shipArray[4])

        StartButton.addEventListener('click', playGameSingle)
    }

    //create board
    function createBoard(grid, squares) {
        for (let i = 0; i < width * width; i++){
            const square = document.createElement('div')
            square.dataset.id = i
            grid.appendChild(square)
            squares.push(square)
        }
    }

    createBoard(userGrid, userSquares)
    createBoard(computerGrid, computerSquares)

    const shipArray = [
        {
            name: 'destroyer',
            directions:[
                [0,1],
                [0,width]
            ]
        },

        {
            name: 'submarine',
            directions:[
                [0,1,2],
                [0, width, width*2]
            ]
        },

        {
            name: 'cruiser',
            directions:[
                [0,1,2],
                [0, width, width*2]
            ]
        },

        {
            name: 'battleship',
            directions:[
                [0,1,2,3],
                [0, width, width*2 , width*3]
            ]
        },

        {
            name: 'carrier',
            directions:[
                [0,1,2,3,4],
                [0, width, width*2 , width*3, width*4]
            ]
        }
    ]

    function generate(ship){
        let randomDirection = Math.floor(Math.random() * ship.directions.length)
        let current = ship.directions[randomDirection]
        if (randomDirection === 0) direction = 1  //가로
        if (randomDirection === 1) direction = 10  //세로
        let randomStart = Math.abs(Math.floor( Math.random() * computerSquares.length - (ship.directions[0].length * direction) ))

        const isTaken = current.some(index => computerSquares[randomStart + index].classList.contains('taken'))
        const isAtRightEdge = current.some(index => (randomStart+index) % width === width - 1)
        const isAtLeftEdge = current.some(index => (randomStart+index) % width === 0)

        if (!isTaken && !isAtRightEdge && !isAtLeftEdge) current.forEach(index => computerSquares[randomStart + index].classList.add('taken', ship.name))

        else generate(ship)
        
    }

    //rotate the ships
    function rotate(){
        if(isHorizontal) {

            destroyer.classList.toggle('destroyer-container-vertical')
            submarine.classList.toggle('submarine-container-vertical')
            crusier.classList.toggle('cruiser-container-ver[randomatical')
            battleship.classList.toggle('battleship-container-vertical')
            carrier.classList.toggle('carrier-container-vertical')
            isHorizontal = false
            return
        }
        if(!isHorizontal) {

            destroyer.classList.toggle('destroyer-container-vertical')
            submarine.classList.toggle('submarine-container-vertical')
            crusier.classList.toggle('cruiser-container-vertical')
            battleship.classList.toggle('battleship-container-vertical')
            carrier.classList.toggle('carrier-container-vertical')
            isHorizontal = true
            return
        }
    }
    rotateButton.addEventListener('click', rotate)


    //move around user ship
    ships.forEach(ship => ship.addEventListener('dragstart', dragStart))
    userSquares.forEach(square => square.addEventListener('dragstart', dragStart))
    userSquares.forEach(square => square.addEventListener('dragover', dragOver))
    userSquares.forEach(square => square.addEventListener('dragenter', dragEnter))
    userSquares.forEach(square => square.addEventListener('dragleave', dragLeave))
    userSquares.forEach(square => square.addEventListener('drop', dragDrop))
    userSquares.forEach(square => square.addEventListener('dragend', dragEnd))

    let selectedShipNameWithIndex
    let draggedShip
    let draggedShipLength

    ships.forEach (ship => ship.addEventListener('mousedown', (e)=>{
        selectedShipNameWithIndex = e.target.id
        console.log("SNWI:" + selectedShipNameWithIndex)
    }))

    function dragStart() {
        draggedShip = this
        draggedShipLength = this.childNodes.length
        console.log(draggedShip)
    }

    function dragOver(e){
        e.preventDefault()
    }

    function dragEnter(e){
        e.preventDefault()
    }

    function dragLeave(){
        console.log('drag leave')
    }

    function dragDrop (){
        let shipNameWithLastId = draggedShip.lastChild.id
        let shipClass = shipNameWithLastId.slice(0, -2)
        console.log(shipClass)
        let lastShipIndex = parseInt(shipNameWithLastId.substr(-1))
        let shipLastId = lastShipIndex + parseInt(this.dataset.id)
        console.log(shipLastId)
        const notAllowedHorizontal = [0,10,20,30,40,50,60,70,80,90,1,11,21,31,41,51,61,71,81,91,2,22,32,42,52,62,72,82,92,3,13,23,33,43,53,63,73,83,93]
        const notAllowedVertical = [99,98,97,96,95,94,93,92,91,90,89,88,87,86,85,84,83,82,81,80,79,78,77,76,75,74,73,72,71,70,69,68,67,66,65,64,63,62,61,60]
        let newNotAllowedHorizental = notAllowedHorizontal.splice(0, 10*lastShipIndex)
        let newNotAllowedVertical = notAllowedVertical.splice(0, 10*lastShipIndex)

        let selectedShipIndex = parseInt(selectedShipNameWithIndex.substr(-1))
    
        shipListId = shipLastId - selectedShipIndex
        console.log(shipListId)

        if (isHorizontal && !newNotAllowedHorizental.includes(shipLastId)) {
            for (let i = 0; i < draggedShipLength; i++) {
                userSquares[parseInt(this.dataset.id) - selectedShipIndex + i].classList.add('taken',shipClass)
            }
        } else if (!isHorizontal && !newNotAllowedVertical.includes(shipLastId)) {
            for (let i = 0; i < draggedShipLength; i++) {
                userSquares[parseInt(this.dataset.id) - selectedShipIndex + width * i].classList.add('taken', shipClass)
            }
        } else return

        displayGrid.removeChild(draggedShip)

        if(!displayGrid.querySelector('.ship')) allShipsPlaced = true

    }

    function dragEnd(){
        console.log('dragged');
    }


    function playgameMulti(socket) {
        if(isGameOver) return
        if(!ready) {
            socket.emit('player-ready')
            ready = true
            playerReady(playerNum)
        }

        if(enemyReady){
            if(currentPlayer === "user") {
                turnDisplay.innerHTML = 'your go'
            }
            if(currentPlayer=== "enemy"){
                turnDisplay.innerHTML = 'Enemy`s go'
            }
        }
    }

    function playerReady(num) {
        let player = `.p${parseInt(num) + 1}`
        document.querySelector(`${player} .ready span`).classList.toggle('green')
        
    }

    //game
    function playGameSingle() {
        console.log(1);
        if (isGameOver) return

        if (currentPlayer == 'user') {
            turnDisplay.innerHTML = 'Your Go'
            computerSquares.forEach(square => square.addEventListener('click', function(e) {
                shotFired = square.dataset.id
                revealSquare(square.classList)
            }))
        }
        if (currentPlayer == 'enemy') {
            turnDisplay.innerHTML = 'Computers Go'
            setTimeout(enemyGo, 1000)
        }
    }

    let destroyerCount = 0
    let submarineCount = 0
    let cruiserCount = 0
    let battleshipCount = 0
    let carrierCount = 0

    function revealSquare(classList) {
        const enemySquare = computerGrid.querySelector(`div[data-id='${shotFired}']`)
        const obj = Object.values(classList)
        if (!enemySquare.classList.contains('boom') && currentPlayer === 'user' && !isGameOver){
            if (obj.includes('destroyer')) destroyerCount++
            if (obj.includes('submarine')) submarineCount++
            if (obj.includes('cruiser')) cruiserCount++
            if (obj.includes('battleship')) battleshipCount++
            if (obj.includes('carrier')) carrierCount++
        }

        if (obj.contains('taken')) {
            enemySquare.classList.add('boom')
        } else {
            enemySquare.classList.add('miss')
        }
        checkForwins()
        currentPlayer = 'enemy'
        if(gameMode === 'singlePlayer') playGameSingle()
    }

    let cpuDestroyerCount = 0
    let cpuSubmarineCount = 0
    let cpuCruiserCount = 0
    let cpuBattleshipCount = 0
    let cpuCarrierCount = 0

    function enemyGo(square) {
        if(gameMode === 'singlePlayer') square = Math.floor(Math.square() * userSquares.length)
        if (!userSquares[square].classList.contains['boom']){
            userSquares[square].classList.add('boom')
            if (userSquares[square].classList.contains('destroyer')) cpuDestroyerCount++
            if (userSquares[square].classList.contains('submarine')) cpuSubmarineCount++
            if (userSquares[square].classList.contains('cruiser')) cpuCruiserCount++
            if (userSquares[square].classList.contains('battleship')) cpuBattleshipCount++
            if (userSquares[square].classList.contains('carrier')) cpuCarrierCount++
            checkForwins()
        } else if (gameMode === "singlePlayer") enemyGo()
        currentPlayer = 'user'
        turnDisplay.innerHTML = 'Your Go'
    }

    function  checkForwins() {
        let enemy = 'computer'
        if(gameMode == 'multiPlayer') enemy = 'enemy'
        if (destroyerCount ===2){
            infoDisplay.innerHTML = `You sunk the ${enemy} destroyer`
            destroyerCount = 10
        }
        if (submarineCount ===3){
            infoDisplay.innerHTML = `You sunk the ${enemy} submarine`
            submarineCount = 10
        }
        if (cruiserCount ===3){
            infoDisplay.innerHTML = `You sunk the ${enemy} cruiser`
            cruiserCount = 10
        }
        if (battleshipCount ===4){
            infoDisplay.innerHTML = `You sunk the ${enemy} computers battleship`
            battleshipCount = 10
        }
        if (carrierCount ===5){
            infoDisplay.innerHTML = `You sunk the ${enemy} computers carrier`
            carrierCount = 10
        }

        if (cpuDestroyerCount ===2){
            infoDisplay.innerHTML = `${enemy} sunk your Destroyer`
            cpuDestroyerCount = 10
        }
        if (cpuSubmarineCount ===3){
            infoDisplay.innerHTML = `${enemy} sunk your Submarine`
            cpuSubmarineCount = 10
        }
        if (cpuCruiserCount ===3){
            infoDisplay.innerHTML = `${enemy} sunk your Cruiser`
            cpuCruiserCount = 10
        }
        if (cpuBattleshipCount ===4){
            infoDisplay.innerHTML = `${enemy} sunk your Battleship`
            cpuBattleshipCount = 10
        }
        if (cpuCarrierCount ===5){
            infoDisplay.innerHTML = `${enemy} sunk your Carrier`
            cpuCarrierCount = 10
        }

        if ((destroyerCount + submarineCount + cruiserCount + battleshipCount + carrierCount)=== 50){
            infoDisplay.innerHTML = "YOU WIN"
            gameOver()
        }
        if ((cpuDestroyerCount + cpuSubmarineCount + cpuCruiserCount + cpuBattleshipCount + cpuCarrierCount)=== 50){
            infoDisplay.innerHTML = `${enemy.toLocaleUpperCase()} WINS`
            gameOver()
        }

        console.log("player")
        console.log( destroyerCount + submarineCount + cruiserCount + battleshipCount + carrierCount)
        console.log("cpu" )
        console.log(cpuDestroyerCount + cpuSubmarineCount + cpuCruiserCount + cpuBattleshipCount + cpuCarrierCount)
    }

    function gameOver() {
        isGameOver = true
        StartButton.removeEventListener('click',playGameSingle)
    }

})
