[Try it out here!](https://freezedriedmangos.github.io/realistic-planet-generation-and-simulation/build/index.html)

[Click here to check out the source code on github](https://github.com/FreezeDriedMangos/realistic-planet-generation-and-simulation)

![An HD render of the mercador projection of a planet generated with this project](Showoff/IMG_1550.PNG?raw=true "HD Render of Default Seed")

# realistic-planet-generation-and-simulation

Generation of a planet through plate tectonics and simulation of weather, climate, and ocean currents.

*_Please scroll down to read the instructions._*

You will not see anything after starting the program, this is expected. I wrote in the instructions how to start the generation/simulation.

## Features

- Terrain generated via plate tectonics 
    - The underlying tectonic plates are accessible post-generation if you want to see them drawn to the screen or do further calculations 
- Procedural weather, including dynamic simulations of
    - Air temperature 
    - Ocean temperature 
    - Humidity
    - Clouds and rainfall
    - Wind
- Procedural climate, including dynamic simulation of
    - Rivers
    - Lakes
    - Ground water
    - Lushness vs desert-ness
    - Ocean currents (!!)
        - Scroll down a bit to see why I’m excited about this one in particular 
    - A day/night cycle
        - Including mountains casting shadows
    - Seasons (notice how the sun’s lattitude changes slowly over time)
- Highly configurable generation
- Configurable viewing. Take a visual look at 
    - The air temperature 
    - The ocean temperature 
    - The humidity
    - The ocean gyres
    - And more!
- A very nice HD rendering mode (called Quads)

## Instructions

Click and drag on the equal signs at the bottom of the screen to bring up the 3 different menus.

On the left is the generation menu. It contains all the buttons and dials you need to change the way the planet generates and/or simulates. Change the seed, number of plates, day and year length, and more!

**To generate the terrain, click the regenerateMap button.**

*To simulate the weather, click the update checkbox, or the forceUpdate button to do it step by step.* 

The middle menu is the readout menu. Click on a region and see some particular values associated with it!

The right menu is the drawing menu. Click "Quads" and wait a while and you’ll get an HD render of your map! *Make sure the update box is UNCHECKED before clicking this.* Weather simulation steps are computationally expensive just by themselves, without the added strain of also making an HD render of every frame.

[Try it out here!](https://freezedriedmangos.github.io/realistic-planet-generation-and-simulation/build/index.html)

## Notes and credit

This project was written entirely in p5js on the iOS Processing app. It runs on iPad better than iPhone, but should run even better on desktop (I haven’t tested that though).

Making this project, I drew heavily from the following two projects, both for inspiration and in execution. I want to give a huge shoutout to these people for making their code public.

Planet and Terrain:

https://www.redblobgames.com/x/1843-planet-generation/

https://github.com/redblobgames/1843-planet-generation

Weather:

https://nickmcd.me/2018/07/10/procedural-weather-patterns/

https://github.com/weigert/proceduralweather

**Additional libraries Used**

Voronoi:

https://github.com/gorhill/Javascript-Voronoi

Pixel Font:

I lost the link, but keep in mind that it's not originally mine.

## Ocean Currents

I’m really excited to share this with you.

Unlike plate tectonics and weather with the incredible two resources above, I couldn’t find anything anywhere online about how to generate ocean currents. 

The closest I got was a few guides on creating ocean currents by hand on a fantasy map. Usually this kind of thing is very helpful, but for this case in particular, it unfortunately wasn’t.

So, to help out whoever else wants to do that, I’ll add some keywords here for google to pick up on, before my writeup.
- Procedural generation of ocean currents
- Simulated currents in the ocean
- Ocean currents on a procedurally generated map
- Algorithm for fake ocean currents

There, I think that should cover it.

### Overview

[Click here to check out the source code on github](https://github.com/ClayDiGiorgio/realistic-planet-generation-and-simulation)

I included a more in-depth, but less well edited, summary of my approach in the project files, but here’s a quick overview. 

Keeping in mind that the map in this project is divided into small voronoi cells called regions, the basic idea is to first group those regions into gyres and then to assign each cell with a current direction based on its position relative to the center of the gyre. 

"But wait!" I hear you say. "Aren’t currents supposed to be able to split when they hit land? Wouldn’t you need at least two directions per region to account for this?" 

That’s a great point! But it turns out that the method I came up with still accounts for currents splitting when they hit land, somehow. It’s magic, I can’t really tell ya why that happens.

One thing to keep in mind before checking out the more in-depth explanation is that when I said "assign each cell with a current direction based on its position relative to the center of the gyre", I lied. Well, I simplified. The reality is that each cell is assigned a current direction based on its distance from the edge of the gyre compared to its neighbors’ distances from the edge of the gyre, and its position relative to those neighbors. 

Alright, you should be equipped with everything you need to know now. Go ahead and dive in! (The picture really helps, check that out first maybe.)

![Overview image](CurrentsGenerationAlgorithm/CurrentsAlgorithmStep-by-step.PNG?raw=true "An image showing the currents generation process step by step")

## Other stuff

Feel free to do whatever you want with this code!

One application I thought would be particularly cool is combining this with seblague’s projects to create procedurally generated, realistic planets you can walk around on in VR. 

There are several rendering bugs in the web build I've provided. I'm not sure where they came from. One issue is that the only line that will render is the equator, and another one is that quad rendering just doesn't work. It gets stuck in a few places, such as cfunc not being defined. None of these bugs are present when running this project on the iPad/iOS app. 

I’ve also included my TODO list in this repo, so you can check that out if you want to continue development on this project and want ideas.

The code is a giant mess and poorly commented, sorry about that.

I used a pixel font drawer because, at least on iOS, a WEBGL canvas cannot draw text. This was not made by me, however unfortunately I’ve lost the link to the github repo I used it from.

A major improvement that could be done is efficiency. This project used to run so fast, but as I bogged it down with more and more features, it got sooo slooooowwww.

My major feature wishlist, in addition to my todolist:
- Rivers deposit sediment where they slow down or reach the ocean
- Local water levels 
    - Inland seas can grow, shrink, dry up, and reappear
    - Lakes can form more naturally 
    - Tides
- Improve hotspot islands
- Do terrain generation in two passes, first with original terrain generation, then smooth that out and use it as a base to a second pass using the "better plates" method
- slow down and smooth out weather: advance weather only once every 10 weather steps. on the inbetween steps, lerp between the last results of advanceWeather and the next results

Lastly, thanks for checking this out! I hope you find it useful or just cool to look at or something.
