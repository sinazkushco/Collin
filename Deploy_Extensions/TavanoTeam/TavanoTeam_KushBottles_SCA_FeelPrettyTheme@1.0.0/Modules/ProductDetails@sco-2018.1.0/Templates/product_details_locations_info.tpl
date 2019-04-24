{{#if showShipFrom}}
    {{!-- <p class="location_header"><b>Ship From:</b></p> --}}

    <table class="location_table">
        <tr class="location_table_header">
            <th class="location_table_header_item">Ships From</th>
        {{#if ../isPrivate}}
            <th class="location_table_header_item">Quantity</th>
        {{/if}}
        </tr>

        {{#each locationsToShow}}
        <tr class="location_table_row">
            <td>{{name}}</td>
            
            {{#if ../isPrivate}}
                <td class="location_table_qty">{{qtyAvailable}}</td>
            {{/if}}    
        </tr>

        {{/each}}
    </table>
{{/if}}