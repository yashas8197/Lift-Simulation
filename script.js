// Grabbing the form and building elements from the HTML
const userInput = document.querySelector(".user_input"); // The entire form section
const userForm = document.getElementById("user_form"); // The form where the user inputs floors and lifts
const building = document.querySelector(".building"); // The section where floors and lifts will be displayed

// Variables to store the total number of lifts and floors
let totalLifts = 0;
let totalFloors = 0;
let pendingFloors = []; // Array to keep track of floor requests when all lifts are busy
let isLiftMoving = []; // Array to track which lifts are currently moving

// Event listener for form submission
userForm.addEventListener("submit", validateUserForm);

function validateUserForm(event) {
  event.preventDefault(); // Prevents the form from reloading the page when submitted

  // Get the values input by the user
  const liftCount = document.querySelector("#totalLifts").value.trim();
  const floorCount = document.querySelector("#totalFloors").value.trim();

  // Regular expression to detect non-digit characters
  const invalidChars = /\D/;

  // Validating the user's input
  if (!liftCount || !floorCount) {
    alert("Please enter both the number of lifts and floors.");
  } else if (invalidChars.test(liftCount) || invalidChars.test(floorCount)) {
    alert("Please enter valid numbers without any special characters.");
  } else if (+liftCount < 0) {
    alert("The number of lifts should be greater than 0.");
  } else if (+floorCount <= 0) {
    alert("The number of floors should be greater than 0.");
  } else if (+floorCount > 9999) {
    alert("App will crash if the number of floors is more than 9999.");
  } else {
    building.innerHTML = ""; // Clear the building area
    totalFloors = +floorCount;
    totalLifts = +liftCount;

    userInput.style.display = "none"; // Hide the input form

    // Create floors and lifts based on the user's input
    generateFloors();
    generateLifts();
  }
}

function generateFloors() {
  // Generate floors from the top (highest number) to the bottom (1st floor)
  for (let i = totalFloors; i >= 1; i--) {
    const floorDiv = document.createElement("div"); // Create a div for each floor
    const btnsDiv = document.createElement("div"); // Create a container for the buttons
    const upBtn = document.createElement("button"); // Create the UP button
    const downBtn = document.createElement("button"); // Create the DOWN button

    floorDiv.className = `floor_container`; // Assign a class to the floor container
    btnsDiv.className = `floor_btns-container`; // Assign a class to the button container

    upBtn.className = `btn`; // Assign a class to the UP button
    upBtn.textContent = "UP"; // Set text for the UP button

    downBtn.className = `btn`; // Assign a class to the DOWN button
    downBtn.textContent = "DOWN"; // Set text for the DOWN button

    // Add event listeners to the buttons
    upBtn.addEventListener("click", buttonClickHandler);
    downBtn.addEventListener("click", buttonClickHandler);

    if (i === totalFloors) {
      upBtn.setAttribute("disabled", true);
    } else if (i === 1) {
      downBtn.setAttribute("disabled", true);
    }

    // Set attributes to identify which floor the buttons belong to
    floorDiv.setAttribute("floor-id", i);
    upBtn.setAttribute("floor-id", i);
    downBtn.setAttribute("floor-id", i);

    // Add buttons to the button container and then add the button container to the floor
    btnsDiv.append(upBtn, downBtn);
    floorDiv.append(btnsDiv);
    building.append(floorDiv); // Add the floor to the building section
  }
}

function generateLifts() {
  // Get the ground floor (1st floor)
  const firstFloor = document.querySelector('[floor-id="1"]');

  // Create the lifts and place them on the ground floor
  for (let i = 0; i < totalLifts; i++) {
    let liftContainer = document.createElement("div");
    liftContainer.className = "lift"; // Assign a class to the lift

    const liftDoors = document.createElement("div");
    liftDoors.className = "lift_doors-container";
    const liftLeftDoor = document.createElement("div");
    const liftRightDoor = document.createElement("div");

    liftLeftDoor.className = "left-door";
    liftRightDoor.className = "right-door";

    liftContainer.id = `lift ${i}`;

    liftDoors.append(liftLeftDoor, liftRightDoor);
    liftContainer.append(liftDoors);

    liftContainer.id = `lift${i}`; // Give each lift a unique ID

    firstFloor.append(liftContainer); // Place the lift on the 1st floor
    isLiftMoving[i] = false; // Initialize all lifts as not moving
  }
}

function buttonClickHandler(event) {
  const element = event.target; // The button that was clicked
  const destinationFloor = Number(element.getAttribute("floor-id")); // Get the floor number where the button was clicked

  // Check if a lift is already on the destination floor
  let { liftElement, liftId } = checkIsLiftAlreadyPresent(destinationFloor);

  if (!liftElement) {
    // If no lift is at the destination, find the nearest available lift and move it
    const availableLift = getAvailableLift(destinationFloor);
    if (availableLift) {
      moveLift(availableLift, destinationFloor);
    } else {
      // If all lifts are busy, add the request to the pending queue
      pendingFloors.push(destinationFloor);
    }
  }
}

function getAvailableLift(destinationFloor) {
  const allLiftElements = document.querySelectorAll(".lift");
  let nearestLift = null;
  let minDistance = Infinity; // Start with an infinitely large distance

  // Find the nearest available lift (one that is not moving)
  allLiftElements.forEach((lift, index) => {
    if (!isLiftMoving[index]) {
      // Check if the lift is not moving
      const currentFloor =
        Math.abs(parseInt(lift.style.transform.split("(")[1]) || 0) / 10 + 1; // Calculate the current floor of the lift
      const distance = Math.abs(destinationFloor - currentFloor); // Calculate the distance to the requested floor

      if (distance < minDistance) {
        minDistance = distance; // Update the minimum distance
        nearestLift = { liftElement: lift, liftId: index }; // Keep track of the nearest lift
      }
    }
  });

  return nearestLift; // Return the nearest available lift
}

function moveLift(liftInfo, destinationFloor) {
  const { liftElement, liftId } = liftInfo; // Get the lift element and its ID
  const height = -(destinationFloor - 1) * 10; // Calculate the Y-axis translation

  isLiftMoving[liftId] = true; // Mark the lift as moving
  liftElement.style.transition = `transform 2s ease-in-out`; // Set the speed based on the distance
  liftElement.style.transform = `translateY(${height}rem)`; // Move the lift to the destination

  // Open the lift doors after it reaches the floor
  setTimeout(() => {
    openLiftDoors(liftElement); // Open the doors

    setTimeout(() => {
      closeLiftDoors(liftElement); // Close the doors after a delay

      // After the doors close, mark the lift as available and handle any pending requests
      setTimeout(() => {
        isLiftMoving[liftId] = false; // Mark the lift as available
        if (pendingFloors.length > 0) {
          const nextFloor = pendingFloors.shift();
          moveLift(liftInfo, nextFloor); // Move the lift to the next pending floor
        }
      }, 2500); // Wait for the doors to close before marking the lift as available
    }, 2500); // Keep the doors open for 2.5 seconds before closing them
  }, 2000); // Wait for the lift to reach the floor plus an additional 2 seconds
}

function openLiftDoors(liftElement) {
  const liftDoors = liftElement.querySelector(".lift_doors-container");
  liftDoors.classList.add("openLift");
  liftDoors.classList.remove("closeLift");
}

function closeLiftDoors(liftElement) {
  const liftDoors = liftElement.querySelector(".lift_doors-container");
  liftDoors.classList.add("closeLift");
  liftDoors.classList.remove("openLift");
}

function checkIsLiftAlreadyPresent(destinationFloor) {
  /* const allLiftElements = document.querySelectorAll(".lift");
  const height = -(destinationFloor - 1) * 10; // Calculate the Y position for the requested floor

  for (const lift of allLiftElements) {
    if (lift.style.transform == `translateY(${height}rem)`) {
      // Check if any lift is already at the destination floor
      let liftName = lift.id; //lift 1 , 2
      let liftId = Number(liftName.replace(/\D/g, "")); // Extract the lift ID from the lift's name
      return { liftElement: lift, liftId }; // Return the lift if found
    }
  } */

  return { liftElement: null, liftId: null }; // Return null if no lift is found at the destination floor
}
