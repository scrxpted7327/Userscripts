// ==UserScript==
// @name         Coffee Shop Mod
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  utility mod for coffee shop
// @author       scrxpted
// @match        https://www.culinaryschools.org/kids-games/coffee-shop/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=culinaryschools.org
// @grant        none
// @sandbox      raw
// ==/UserScript==

function waitForObjectAndThen(get, check, func) {
    var objectListener = setInterval(() => {
        var obj = get()
        if (check(obj) == true) {
            clearInterval(objectListener);
            func()
        }
    }, 100)
}

function onLoad(func) {
    waitForObjectAndThen(function() {
        return document.querySelector('#screen-main')
    }, function(obj) {
        return (obj.className != 'show')
    }, function() {
        waitForObjectAndThen(function() {
            return document.querySelector('.reputation')
        }, function(obj) {
            if (obj != null) {
                return obj.innerHTML.split('"')[3] != null
            }
            return false
        }, func)
    })
}

function createElement (type, ...args) { // createElement(type, properties, parent): Node
    if (type == null || typeof type !== 'string') {
      throw Error('The element type must be a string');
    }
  
    if (args[0] !== undefined && Object.prototype.toString.call(args[0]) !== '[object Object]') { 
      throw Error('The options argument must be an object'); 
    }
    const { attrs = {}, children = [] } = args[0] || {};

    const element = document.createElement(type)

    for (const [key, value] of Object.entries(args[0])) {
        if (typeof value == 'object') {
            for (const [key2, value2] of Object.entries(value)) {
                element[key][key2] = value2
            }
        } else {
            element[key] = value
        }
    }
    //console.log(args[1])
    args[1].appendChild(element)
    return element
}

function getUI() {
    return {
        addCustomLabel: function addCustomLabel(i) { // {tag: string, left: number, top: number, fontSize: number, fontSize2: number}
            const element = createElement('text', { id: i.tag, className: i.tag, style: {
                position: 'absolute',
                left: i.left + 'px',
                top: i.top + 'px',
                width: i.width + 'px',
                height: '45px',
                ['padding-right']: '0px',
                color: i.colorHex,
                font: i.fontSize + 'px/' + i.fontSize2 + 'px TW Cen MT',
                ['text-align']: 'left',
                ['text-shadow']: '2px 1px 1px #000',
                ['font-variant-numeric']: 'tabular-nums lining-nums',
                ['pointer-events']: 'none'
            }}, document.getElementById('screen-game'))
            return {
                Object: element,
                updateText: function updateText(text) {
                    element.innerHTML = text
                },
                show: function show() {
                    element.hidden = false
                },
                hide: function hide() {
                    element.hidden = true
                }
            }
        },
        appendLabel: function appendLabel(i) { // {tag: string, left: number, top: number, fontSize: number, fontSize2: number}
            this.offset = this.offset != undefined ? this.offset : 120
            this.offset += 16
            const element = createElement('text', { id: i.tag, className: i.tag, style: {
                position: 'absolute',
                left: '3px',
                top: this.offset + 'px',
                width: i.width + 'px',
                height: '45px',
                ['padding-right']: '0px',
                color: i.colorHex,
                font: i.fontSize + 'px/' + i.fontSize2 + 'px TW Cen MT',
                ['text-align']: 'left',
                ['text-shadow']: '2px 1px 1px #000',
                ['font-variant-numeric']: 'tabular-nums lining-nums',
            }}, document.getElementById('screen-game'))
            return {
                Object: element,
                updateText: function updateText(text) {
                    element.innerHTML = text
                },
                show: function show() {
                    element.hidden = false
                },
                hide: function hide() {
                    element.hidden = true
                }
            }
        },
        createButton: function createButton(i) { // {tag: string, left: number, top: number, fontSize: number, fontSize2: number}
            this.offset = this.offset != undefined ? this.offset : 120
            this.offset += 16
            const element = createElement('button', { id: i.tag, className: i.tag, style: {
                position: 'absolute',
                left: '3px',
                top: this.offset + 'px',
                width: i.width + 'px',
                height: '45px',
                ['padding-right']: '0px',
                color: i.colorHex,
                font: i.fontSize + 'px/' + i.fontSize2 + 'px TW Cen MT',
                ['text-align']: 'left',
                ['text-shadow']: '2px 1px 1px #000',
                ['font-variant-numeric']: 'tabular-nums lining-nums',
            }}, document.getElementById('screen-game'))
            element.addEventListener('click', i.callback)
            return {
                Object: element,
                updateText: function updateText(text) {
                    element.innerHTML = text
                },
                show: function show() {
                    element.hidden = false
                },
                hide: function hide() {
                    element.hidden = true
                }
            }
        },
    }
}

(function() {
    'use strict';

    onLoad(function() {
        const uiLibrary = getUI()

        // init ui
        const reputationUI = uiLibrary.addCustomLabel({
            tag: 'reputationUI',
            left: 3,
            top: 412,
            colorHex: '#1fe81a',
            fontSize: 17,
            fontSize2: 30,
            width: 200
        })

        const reputationIncreaseUI = uiLibrary.appendLabel({
            tag: 'reputationIncreaseUI',
            colorHex: '#1fe81a',
            fontSize: 16,
            fontSize2: 32,
            width: 200
        })
        const predictedBalanceUI = uiLibrary.appendLabel({
            tag: 'predictedBalanceUI',
            colorHex: '#1fe81a',
            fontSize: 16,
            fontSize2: 32,
            width: 200
        })
        const demandUI = uiLibrary.appendLabel({
            tag: 'demandUI',
            colorHex: '#1fe81a',
            fontSize: 16,
            fontSize2: 32,
            width: 200
        })
        const customersUI = uiLibrary.appendLabel({
            tag: 'customersUI',
            colorHex: '#1fe81a',
            fontSize: 16,
            fontSize2: 32,
            width: 200
        })

        const dayStatsElement = document.getElementById('screen-day-stats')
        const prepareTabElement = document.getElementById('game-tab-prepare')
        const startDayButton = document.querySelector("button.start-day")
        const bypassDayButton = uiLibrary.createButton({
            tag: 'bypassDayButton',
            colorHex: '#1fe81a',
            fontSize: 16,
            fontSize2: 32,
            width: 200,
            callback: function bypassDay() {
                dayStatsElement.classList.add('hidden')
                prepareTabElement.classList.remove('hidden')
                startDayButton.disabled = false
                $0.parentElement.children[0].children.forEach(function(element) {
                    element.classList.remove('hidden')
                    element.classList.add('active')
                })
            }
        })
        bypassDayButton.updateText('funny')
        
        
        // create reputation variables
        const reputationElement = document.querySelector('.reputation')
        var reputationString
        var reputation, oldReputation = -1

        // create balance variables
        const balanceElement = document.querySelector('.balance')
        var balance, oldBalance, previousBalance = -1


        // create price variables
        const priceElement = document.querySelector(".prepare .price .slider")
        const priceElement2 = document.querySelector(".serve-price")
        var price, oldPrice = -1


        // create weather variables
        const weatherElement = document.querySelector('.weather.small')
        var weather, oldWeather = 'none'
        const weatherMap = {
            freezing: 1,
            cold: 0.9,
            cool: 0.6,
            warm: 0.25
        }

        function clamp(n, min, max) {
            return n < min ? min : n > max ? max : n
        }

        // create prediction variables
        var demand = 0



        // create inventory variables
        const coffeeElement = document.querySelector('.slider[data-state="recipeCoffee"]')
        const milkElement = document.querySelector('.slider[data-state="recipeMilk"]')
        const sugarElement = document.querySelector('.slider[data-state="recipeSugar"]')


        const ingredientQuality = {
            coffee: 0,
            milk: 0,
            sugar: 0,
            oldCoffee: 0,
            oldMilk: 0,
            oldSugar: 0,
        }
        

        const ingredientBaseQuality = {
            coffee: {
                min: 0,
                max: 4
            },
            milk: {
                min: 0,
                max: 2
            },
            sugar: {
                min: 0,
                max: 4
            },
        }


        const inv = {
            getIdealRecipe: function getIdealRecipe() {
                return {
                    coffee: ingredientBaseQuality.coffee.max,
                    milk: ingredientBaseQuality.milk.max,
                    sugar: ingredientBaseQuality.sugar.max
                }
            },
            getQualityOfIngredient: function getQualityOfIngredient(quality, ingredient, ideal) {
                var min = ingredientBaseQuality[ingredient].min
                , ratio = ingredientBaseQuality[ingredient].max - min
                , current = (quality - min) / ratio
                , best = (ideal[ingredient] - min) / ratio;
                return clamp(1 - Math.abs(current - best) + 0.2, 0, 1)
            },
            getNormalizedPrice: function getNormalizedPrice() {
                return Math.min(price / 650, 1)
            }
        }


        function predictSatifaction() {
            var ideal = inv.getIdealRecipe()
            var coffee = inv.getQualityOfIngredient(ingredientQuality.coffee, "coffee", ideal)
                , milk = inv.getQualityOfIngredient(ingredientQuality.milk, "milk", ideal)
                , sugar = inv.getQualityOfIngredient(ingredientQuality.sugar, "sugar", ideal)
            return coffee * milk * sugar - inv.getNormalizedPrice()
        }

        function predictReputationIncrease(customers) {
            var predictedRep = reputation
            var satisfaction = predictSatifaction()
            for (let i = 0; i <= customers; i++) {
                predictedRep += (0.1 * (satisfaction * (0.9 + 0.3 * 0.2))) // (0.9 + (Math.random() * 0.2))
                predictedRep += (0.1 * (satisfaction * (0.9 + 0.4 * 0.2))) // (0.9 + (Math.random() * 0.2))
                predictedRep += (0.1 * (satisfaction * (0.9 + 0.5 * 0.2))) // (0.9 + (Math.random() * 0.2))
            }
            return predictedRep / 3
        }

        async function updateDemand() {
            demand = weatherMap[weather] * (1 - clamp(price / 650, 0, 1)) + 0.4 * reputation
            if (demand == demand) {
                /*console.log('Demand: ' + demand)
                console.log('Customers: ' + Math.floor(demand * 40))
                console.log('Reputation Increase: ' + (0.1 * (predictSatifaction() * 1.15)))
                console.log('Predicted Balance: $' + demand * 40 * (price / 100))*/
                demandUI.updateText('Demand: ' + (demand == 1 ? 100 : (demand * 100).toPrecision(4)) + '%')
                customersUI.updateText('Customers: ' + Math.floor(demand * 40))
                reputationIncreaseUI.updateText('Reputation Increase: ' + (predictReputationIncrease(Math.floor(demand * 40)) * 10).toPrecision(4) + '%') //(0.1 * (predictSatifaction() * 1.15)).toPrecision(4)
                predictedBalanceUI.updateText('Predicted Balance: $' + ((demand * 40 * (price / 100)) > 99 ? Math.round(demand * 40 * (price / 100)) : (demand * 40 * (price / 100)).toPrecision(2)))
            }
        }
        async function reputationUpdated() {
            //console.log('Reputation: ' + reputation)
            reputationUI.updateText('Reputation: ' + (reputation * 100).toPrecision(4) + '%')
            updateDemand()
        }

        async function balanceUpdated() {
            //console.log('Balance: $' + balance)
        }

        async function priceUpdated() {
            //console.log('Price: $' + price / 100)
            updateDemand()
        }

        async function weatherUpdated() {
            //console.log('Weather: ' + weather + ' (modifier: ' + weatherMap[weather] + ')')
            previousBalance = balance
            updateDemand()
        }

        async function recipeUpdated() {
            updateDemand()
        }

        const variableUpdaters = {
            reputation: async function() {
                reputationString = reputationElement.innerHTML.split('"')[3]
                reputation = parseFloat(reputationString.substring(7, reputationString.length - 3)) / 100
                if (oldReputation != reputation) {
                    reputationUpdated()
                    oldReputation = reputation
                }
            },
            balance: async function() {
                balance = parseFloat(balanceElement.innerHTML)
                if (oldBalance != balance) {
                    balanceUpdated()
                    oldBalance = balance
                }
            },
            price: async function() {
                if (priceElement2.className == 'serve-price hidden') {
                    price = parseFloat(priceElement.innerText.split('$')[3]) * 100
                    if (oldPrice != price) {
                        priceUpdated()
                        oldPrice = price
                    }
                }
            },
            price2: async function() {
                if (priceElement2.className != 'serve-price hidden') {
                    price = parseFloat(priceElement2.innerText.split('$')[4]) * 100
                    if (oldPrice != price) {
                        priceUpdated()
                        oldPrice = price
                    }
                }
            },
            weather: async function() {
                weather = weatherElement.innerText.split(' ')[5]
                if (oldWeather != weather) {
                    weatherUpdated()
                    oldWeather = weather
                }
            },
            recipeCoffee: async function() {
                ingredientQuality.coffee = coffeeElement.innerText.split('\n')[4]
                if (ingredientQuality.oldCoffee != ingredientQuality.coffee) {
                    recipeUpdated()
                    ingredientQuality.oldCoffee = ingredientQuality.coffee
                }
            },
            recipeMilk: async function() {
                ingredientQuality.milk = milkElement.innerText.split('\n')[4]
                if (ingredientQuality.oldMilk != ingredientQuality.milk) {
                    recipeUpdated()
                    ingredientQuality.oldMilk = ingredientQuality.milk
                }
            },
            recipeSugar: async function() {
                ingredientQuality.sugar = sugarElement.innerText.split('\n')[4]
                if (ingredientQuality.oldSugar != ingredientQuality.sugar) {
                    recipeUpdated()
                    ingredientQuality.oldSugar = ingredientQuality.sugar
                }
            }
        }

        for (const [type, bindable] of Object.entries(variableUpdaters)) { // begin catching updates
            setInterval(() => {
                bindable()
            }, 100)
            bindable() // call an initial update
            console.log(type + ' has been started')
        }
    })
})()
