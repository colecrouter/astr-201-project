<script lang="ts">
    import type { Readable } from 'svelte/store';
    import type { SundialData } from './BluetoothDevice';

    export let data: Readable<SundialData | undefined>;
    export let userLocale: string;

    let formattedData = new Map<keyof SundialData, SundialData[keyof SundialData]>();

    data.subscribe((data) => {
        formattedData = new Map<keyof SundialData, SundialData[keyof SundialData]>();

        for (const key in data) {
            // @ts-ignore
            formattedData.set(key, data[key]);
        }
    });
</script>

<ul class="list-group text-capitalize">
    {#each [...formattedData] as [key, value]}
        <li class="list-group-item d-flex justify-content-between align-items-start">
            <div class="ms-2 me-auto">
                <div class="fw-bold">{key}</div>
            </div>
            <span class="badge bg-primary rounded-pill">
                {#if typeof value === 'boolean'}
                    {value ? 'true' : 'false'}
                {:else if typeof value === 'number'}
                    {value.toFixed(2)}°
                {:else if value instanceof Date}
                    {value.toLocaleString(userLocale, { hour12: true, hour: 'numeric', minute: '2-digit' })}
                {:else}
                    {value}
                {/if}
            </span>
        </li>
    {/each}
</ul>
