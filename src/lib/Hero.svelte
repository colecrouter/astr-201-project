<script lang="ts">
    import type { BluetoothSundial } from '$lib/BluetoothDevice';
    import { getSkyColour, isNight } from '$lib/SkyColours';
    import { onMount } from 'svelte';

    export let bluetoothSundial: BluetoothSundial;
    export let userLocale: string = 'en-US';

    let sundialData = bluetoothSundial.data;
    let night = false;

    // Calculate a set of colors to represent the sky's color, based on the azimuth of the sun
    type color = [number, number, number];
    let skyColors: [color, color, color] = [
        [255, 255, 255],
        [255, 255, 255],
        [255, 255, 255],
    ];

    onMount(() => {
        sundialData.subscribe((data) => {
            if (!data) {
                skyColors = [
                    [31, 207, 195],
                    [8, 0, 255],
                    [31, 107, 207],
                ];
                return;
            }

            // Set dark mode
            night = isNight(data.azimuth);

            // Get the first colour using GetSkyColour
            const firstColor = getSkyColour(data.elevation, data.hourAngle);
            skyColors[0] = firstColor;

            // Make the second colour a darker version of the first
            skyColors[1] = [Math.max(0, firstColor[0] - 50), Math.min(255, firstColor[1] + 80), Math.max(0, firstColor[2] - 50)];

            // Make the third colour a lighter version of the first
            skyColors[2] = [Math.min(255, firstColor[0] + 60), Math.max(0, firstColor[1] - 50), Math.min(255, firstColor[2] + 50)];
        });
    });
</script>

<header class="text-body" style:--skyBg={`linear-gradient(to right, ${!night ? '#fff, #c7c7c7' : '#000, #383838'})`} data-bs-theme={night ? 'dark' : 'light'}>
    <div class="background" style:--skyColour={`rgb(${skyColors[0].join(',')})`} />
    <div class="background" style:--skyColour={`rgb(${skyColors[1].join(',')})`} />
    <div class="background" style:--skyColour={`rgb(${skyColors[2].join(',')})`} />
    <div class="content">
        {#if !bluetoothSundial.connected}
            <h1 on:click={bluetoothSundial.connect()}>Click Here to Connect to Bluetooth Device</h1>
        {:else if !bluetoothSundial.data}
            <h1>Waiting for Device...</h1>
        {:else if $sundialData?.correctedTime}
            <h1>It is {$sundialData?.correctedTime.toLocaleString(userLocale, { hour12: true, hour: 'numeric', minute: '2-digit' })}</h1>
        {:else}
            <h1>Waiting for Device...</h1>
        {/if}
    </div>
    <div class="bottom">Scroll down for more info</div>
</header>

<style>
    header {
        /* background: #ff3e00; */
        text-align: center;
        width: 100%;
        height: 100vh;
        max-height: 1000px;
        padding: 3rem;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        overflow: hidden;
        position: relative;
        box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.2);
        background: var(--skyBg);
        transition: background 0.5s ease;
    }

    header > div.background {
        position: absolute;
        border-radius: 100%;
        height: 100%;
        filter: blur(10vw);
        opacity: 0.8;
        background: var(--skyColour);
        transition: background 0.5s ease;
        animation: bg1 15s infinite linear;
    }

    header > div.background:nth-child(1) {
        /* background: #1fcfc3; */
        width: 69rem;
        padding-top: 69%;
        left: 13%;
        top: 54%;
        transform: translateX(-50%) translateY(-50%);
    }

    header > div.background:nth-child(2) {
        /* background: #0800ff; */
        width: 40rem;
        padding-top: 40%;
        left: 50%;
        top: 62%;
        transform: translateX(-50%) translateY(-50%);
    }

    header > div.background:nth-child(3) {
        /* background: #1f6bcf; */
        width: 42rem;
        padding-top: 42%;
        left: 67%;
        top: 22%;
        transform: translateX(-50%) translateY(-50%);
    }

    header .content {
        z-index: 1;
    }

    header h1 {
        transition: color 0.5s ease;
    }

    header .bottom {
        position: absolute;
        bottom: 0;
        margin-bottom: 1em;
    }

    header .bottom::after {
        content: '';
        display: block;
        width: 1em;
        height: 1em;
        border: 2px solid;
        border-top: 0;
        border-left: 0;
        transform: rotate(45deg);
        margin: 1em auto;
        animation: float 2s infinite ease-in-out;
    }

    @keyframes float {
        0% {
            transform: translateY(0) rotate(45deg);
        }
        50% {
            transform: translateY(0.5em) rotate(45deg);
        }
        100% {
            transform: translateY(0) rotate(45deg);
        }
    }

    @keyframes bg1 {
        /* Slowly move around in a circle*/
        0% {
            transform: translateX(-50%) translateY(-50%) rotate(0deg);
        }
        100% {
            transform: translateX(-50%) translateY(-50%) rotate(360deg);
        }
    }
</style>
