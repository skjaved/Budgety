// BUDGET CONTROLLER
var budgetController = (function() {
  var Expense = function(id, description, value) {
    this.id = id;
    this.description = description;
    this.value = value;
    this.percentage = -1;
  };

  Expense.prototype.calcPercentage = function(totalIncome) {
    if (totalIncome > 0) {
      this.percentage = Math.round((this.value/totalIncome) * 100);
    } else {
      this.percentage = -1;
    }
  };

  Expense.prototype.getPercentage = function() {
    return this.percentage;
  }

  var Income = function(id, description, value) {
    this.id = id;
    this.description = description;
    this.value = value;
  };

  // Calculate total income and expenses
  var calculateTotal = function(type) {
    var sum = 0;
    data.allItems[type].forEach(cur => {
      sum += cur.value;
    });
    data.totals[type] = sum;
  };

  // Data structure to store the budget data
  var data = {
    allItems: {
      exp: [],
      inc: []
    },
    totals: {
      exp: 0,
      inc: 0
    },
    budget: 0,
    percentage: -1
  };

  return {
    addItem: function(type, des, val) {
      var newItem, ID;
      // [1, 2, 3, 4] next id = 5
      // [1 2 3 4 6 8] next id = 9
      // ID = last ID + 1
      if (data.allItems[type].length > 0) {
        ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
      } else {
        ID = 0;
      }
      // type gets input from UIController.getInput() method
      if (type === "exp") {
        newItem = new Expense(ID, des, val);
      } else if (type === "inc") {
        newItem = new Income(ID, des, val);
      }

      // Push newItem into our Data Structure
      data.allItems[type].push(newItem);

      // Return the new item
      return newItem;
    },

    deleteItem: function(type, id) {
      var ids, index;
      // id = 6
      // data.allItems[type].[id]
      // ids = [1 2 3 4  8]\
      // index = 3

      // map returns the brand new array of the return elements
      ids = data.allItems[type].map(current => {
        return current.id;
      });

      index = ids.indexOf(id);
      if (index !== -1) {
        // Remove items from the array using splice method
        data.allItems[type].splice(index, 1);
      }
    },

    calculateBudget: function() {
      // Calculate total income and expenses
      calculateTotal("exp");
      calculateTotal("inc");
      // Calculate the budget
      data.budget = data.totals.inc - data.totals.exp;
      // Calculate the percentage of the income that we spent
      if (data.totals.inc > 0) {
        data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
      } else {
        data.percentage = -1;
      }
    },

    calculatePercentages: function() {
      data.allItems.exp.forEach(function(current) {
        current.calcPercentage(data.totals.inc)
      })
    },

    getPercentages: function() {
      var allPerc = data.allItems.exp.map(function(current) {
        return current.getPercentage();
      })
      return allPerc;
    },

    getBudget: function() {
      return {
        budget: data.budget,
        totalInc: data.totals.inc,
        totalExp: data.totals.exp,
        percentage: data.percentage
      };
    },

    testing: function(){
      return data
    }
  };
})();

// UI CONTROLLER
var UIController = (function() {
  // DOMStrings is the object of classnames
  var DOMStrings = {
    inputType: ".add__type",
    inputDescription: ".add__description",
    inputValue: ".add__value",
    inputBtn: ".add__btn",
    incomeContainer: ".income__list",
    expensesContainer: ".expenses__list",
    budgetLabel: ".budget__value",
    incomeLabel: ".budget__income--value",
    expensesLabel: ".budget__expenses--value",
    percentageLabel: ".budget__expenses--percentage",
    container: ".container",
    expItemPerentage: ".item__percentage",
    datelabel: ".budget__title--month"
  };

  // Format numbers
  var formatNumber = function(num, type) {
    var numSplit, int, dec, type;
    /*
    + or - beforet number
    exactly 2 decimal points
    comma seperating the thousands

    2322.2152 -> + 2,322.22
    2000 -> 2,000.00
    */

    num = Math.abs(num);
    num = num.toFixed(2); // show upto two decimal places

    numSplit = num.split(".");

    int = numSplit[0];
    if (int.length > 3) {
      int = int.substr(0, int.length - 3) + "," + int.substr(int.length - 3, 3);
    }
    dec = numSplit[1];
    return (type === "exp" ? "-" : "+") + " " + int + "." + dec;
  };

  var nodeListForEach = function(list, callback) {
    for (var i=0; i < list.length; i++){
      callback(list[i], i);
    }
  }
  // returning the object of functions to public
  return {
    // getInput method returns the object of input values to the appController
    getInput: function() {
      return {
        type: document.querySelector(DOMStrings.inputType).value, // either inc or exp
        description: document.querySelector(DOMStrings.inputDescription).value,
        value: parseFloat(document.querySelector(DOMStrings.inputValue).value)
      };
    },

    addListItem: function(obj, type) {
      var html, newHtml, element;

      // Create the HTML string with placeholder text
      if (type === "inc") {
        element = DOMStrings.incomeContainer;
        html =
          '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
      } else if (type === "exp") {
        element = DOMStrings.expensesContainer;
        html =
          '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
      }

      // Replace the placeholder text with some actual data
      newHtml = html.replace("%id%", obj.id);
      newHtml = newHtml.replace("%description%", obj.description);
      newHtml = newHtml.replace("%value%", formatNumber(obj.value));

      // Insert the HTML string into the DOM
      document.querySelector(element).insertAdjacentHTML("beforeend", newHtml);
    },

    // Delete the element from UI
    // We can only remove child from the DOM
    deleteListItem: function(selectorID) {
      var el;
      el = document.getElementById(selectorID);
      el.parentNode.removeChild(el)
    },

    // This method will clear the input fields
    clearFields: function() {
      var fields, fieldsArray;

      // querySelectorAll method returns the lists
      fields = document.querySelectorAll(
        DOMStrings.inputDescription + "," + DOMStrings.inputValue
      );

      // convert list into the array
      // called slice method from array prototype through call method
      fieldsArray = Array.prototype.slice.call(fields);

      fieldsArray.forEach(function(current) {
        // sets value to empty
        current.value = "";
      });

      // Change the focus to the first element of the input field
      fieldsArray[0].focus();
    },

    // Display budget on UI
    displayBudget: function(obj) {
      var type;
      obj.budget > 0 ? type === 'inc' : type === 'exp';
      document.querySelector(DOMStrings.budgetLabel).textContent = formatNumber(obj.budget, type);
      document.querySelector(DOMStrings.incomeLabel).textContent = formatNumber(obj.totalInc, "inc");
      document.querySelector(DOMStrings.expensesLabel).textContent = formatNumber(obj.totalExp, "exp")
      if (obj.percentage > 0) {
        document.querySelector(DOMStrings.percentageLabel).textContent = obj.percentage + "%";
      } else {
        document.querySelector(DOMStrings.percentageLabel).textContent = "---";
      }
    },

    displayPercentages: function(percentages) {
      var fields = document.querySelectorAll(DOMStrings.expItemPerentage);
      
      nodeListForEach(fields, function(current, index) {
        if (percentages[index] > 0) {
          current.textContent = percentages[index] + "%";
        } else {
          current.textContent = "---";
        }
      })
    },

    displayMonth: function() {
      var now, month, months, year;
      now = new Date();
      months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      month = now.getMonth()
      year = now.getFullYear();
      document.querySelector(DOMStrings.datelabel).textContent = months[month] + " " + year;
    },

    changedType: function() {
      var fields = document.querySelectorAll(
        DOMStrings.inputType + "," +
        DOMStrings.inputDescription + "," +
        DOMStrings.inputValue
      )

      nodeListForEach(fields, function(cur) {
        cur.classList.toggle("red-focus");
      })
    },

    // getDOMStrings method returns the DOMStrings object
    getDOMStrings: function() {
      return DOMStrings;
    }
  };
})();

// GLOBAL APP CONTROLLER
var appController = (function(budgetCtrl, UICtrl) {
  var setupEventListeners = function() {
    // Call fot DOMString method from the UIController
    var DOM = UICtrl.getDOMStrings();

    document.querySelector(DOM.inputBtn).addEventListener("click", ctrlAddItem);

    document.addEventListener("keypress", function(e) {
      if (e.keyCode === 13 || e.which === 13) {
        ctrlAddItem();
      }
    });
    document.querySelector(DOM.container).addEventListener("click", ctrlDeleteItem);
    document.querySelector(DOM.inputType).addEventListener("change", UICtrl.changedType);
  };

  var updateBudget = function() {
    // Calculate the budget
    budgetCtrl.calculateBudget();
    // Return the budget
    var budget = budgetCtrl.getBudget();
    // Display the budget on the UI
    UICtrl.displayBudget(budget);
  };

  var updatePercentages = function() {
    // Calculate percentages
    budgetCtrl.calculatePercentages();
    // Read percentages from the budget controller
    var percentages = budgetCtrl.getPercentages();
    // Update the UI with the new percentages
    console.log(percentages);
    UICtrl.displayPercentages(percentages);
  }

  var ctrlAddItem = function() {
    var input, newItem;
    // Get the field input data
    input = UICtrl.getInput();
    if (input.description !== "" && !isNaN(input.value) && input.value > 0) {
      // Add the item to the budget controller
      newItem = budgetCtrl.addItem(input.type, input.description, input.value);
      // Add the item to the UI
      UICtrl.addListItem(newItem, input.type);
      // Clear input fields
      UICtrl.clearFields();
      // Calculate and update budget
      updateBudget();
      // Calculate and update the percentages
      updatePercentages();
    }
  };

  var ctrlDeleteItem = function(e) {
    var itemID, splitID, type, ID;
    // Targeting the parent element of the target by the event delegation method
    itemID = e.target.parentNode.parentNode.parentNode.parentNode.id;
    if (itemID) {
      // inc-1
      // split is a string method which returns an array after spliting the string
      splitID = itemID.split("-");
      type = splitID[0];
      ID = parseInt( splitID[1]);

      // Delete the item from the data structure
      budgetCtrl.deleteItem(type, ID);
      // Delete the item from the UI
      UICtrl.deleteListItem(itemID);
      // Update and show the new budget
      updateBudget();
      // Calculate and update the percentages
      updatePercentages();
    }
  };

  return {
    init: function() {
      UICtrl.displayMonth();
      UICtrl.displayBudget({
        budget: 0,
        totalInc: 0,
        totalExp: 0,
        percentage: -1
      });
      setupEventListeners();
    }
  };
})(budgetController, UIController);

appController.init();
