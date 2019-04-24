{{#if purchaseOrders.length}}

    <table class="private-item-history-table">

        <thead>
            <tr>
                <th>PO#</th>
                <th>Quantity Received</th>
                <th>Location</th>
                <th>Date Received</th>
            </tr>
        </thead>
        <tbody>
          {{#each purchaseOrders}}
            <tr>
                <td>{{id}}</td>
                <td>{{formatQuantity qty}}</strong></td>
                <td>{{state}}</td>
                <td>{{date}}</td>
            </tr>
          {{/each}}

        </tbody>

    </table>

{{else}}

    <p class="private-items-po-empty-message">There are no purchase orders to display for this item.</p>

{{/if}}

