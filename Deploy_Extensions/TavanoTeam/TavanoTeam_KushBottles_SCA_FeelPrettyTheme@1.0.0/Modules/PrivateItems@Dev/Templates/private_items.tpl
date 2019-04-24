<section id="private-item-{{internalid}}" class="private-item">
  <div class="private-item-table">
  <div class="private-item-toggle private-item-stock-icon {{#unless detailsLoading}}{{#if isInStock}}in-stock {{else}} out-of-stock{{/if}}{{/unless}} ">
    <button data-action="toggle-history" class="private-item-toggle-btn"><i class="icon-angle-down"></i></button>
  </div>
  <div class="private-item-image">
    <img src="{{resizeImage image.url 'thumbnail'}}" alt="{{image.altimagetext}}">
    <p class="private-item-image-price">{{price}}</p>
  </div>
  
  <div class="private-item-description">
    <p class="private-item-sku">{{sku}}</p>
    <h2 class="private-item-title">{{title}}</h2>
  </div>
  
  <div class="private-item-location-inventory">
    <div class="private-item-location-inventory-item first">
      <ul class="private-item-plain-list">
        {{#each locations}}
            <li>{{state}}</li>
        {{/each}}
        <li>Total</li>
      </ul>
    </div>
    <div class="private-item-location-inventory-item last">
      <ul class="private-item-plain-list">
          {{#if detailsLoading}}
            <li>Loading...</li>
          {{else}}
            {{#each locations}}
              <li>{{formatQuantity total}}</li>
            {{/each}}
            <li>{{formatQuantity locationsTotal}}</li>
          {{/if}}
      </ul>
    </div>
  </div>
  
  <div class="private-item-details">
    <div class="private-item-details-inventory">
      <div class="private-item-details-mobile-stock-icon private-item-stock-icon {{#unless detailsLoading}}{{#if isInStock}}in-stock {{else}} out-of-stock{{/if}}{{/unless}}"></div>
      <p class="private-item-details-title">Total Inventory</p>
      {{#if detailsLoading}}
        <p class="private-item-details-qty">Loading...</p>
      {{else}}
        <p class="private-item-details-qty">{{formatQuantity locationsTotal}}</p>
      {{/if}}
      <p class="private-item-details-pack-count">Case Pack Count: 100pcs</p>
    </div>
    <div class="private-item-details-prices">
      <p class="private-item-details-price">{{price}} <span>per unit</span></p>
    </div>
  </div>
  
  <div class="private-item-fields">
    <div class="private-item-fields-item">
      <input class="private-item-fields-input" placeholder="Quantity" type="number" max="{{locationsTotal}}" pattern="[0-9]*" novalidate name="request-shipment" id="request-shipment-{{internalid}}" value="" {{#unless locationsTotal}} disabled {{/unless}}>
      <button data-action="add-to-rs-cart" class="private-item-submit private-item-request-submit" type="submit" {{#unless locationsTotal}} disabled {{/unless}}>Request Shipment</button>
    </div>
    <div class="private-item-fields-item">
      <input class="private-item-fields-input" placeholder="Quantity" type="number" pattern="[0-9]*" novalidate name="reorder" id="reorder-{{internalid}}" value="">
      <button data-action="add-to-reorder-cart" class="private-item-submit private-item-reorder-submit" type="submit">Reorder</button>
    </div>
    
  </div>
  
  <div class="private-item-inventory">
    <div class="btn-group btn-group-justified" role="group" aria-label="...">
      <div class="btn-group" role="group">
        <button data-action="show-inventory-mobile" type="button" class="btn btn-default">Inventory <i class="icon-angle-down"></i></button>
      </div>

      <div class="btn-group" role="group">
        <button data-action="show-purchases-mobile" type="button" class="btn btn-default">Purchase History <i class="icon-angle-down"></i></button>
      </div>
    </div>
    
    <div class="private-item-inventory-items" id="private-item-purchases-mobile-{{internalid}}">
        {{#if purchaseOrders.length}}
        <ul class="private-item-purchase-list">
            {{#each purchaseOrders}}
            <li>
                <h2 class="private-item-purchase-header">{{id}}</h2>
                <table class="private-item-purchase">
                    <tr>
                        <th>Quantity</th>
                        <td>{{formatQuantity qty}}</td>
                    </tr>
                    <tr>
                        <th>Location</th>
                        <td>{{state}}</td>
                    </tr>
                    <tr>
                        <th>Date Received</th>
                        <td>{{date}}</td>
                    </tr>
                </table>
            </li>
            {{/each}}
        </ul>
        {{else}}
            <p class="private-items-po-empty-message">There are no purchase orders to display for this item.</p>
        {{/if}}
    </div>
    
    <div class="private-item-inventory-items" id="private-item-inventory-mobile-{{internalid}}">
      <section class="private-item-inventory-mobile">
        <ul>
          <li><strong>Locations</strong></li>
          {{#each locations}}
              <li>{{state}}</li>
          {{/each}}
          <li>Total</li>
        </ul>
        
        <ul>
          <li><strong>Quantity</strong></li>
          {{#if detailsLoading}}
            <li>Loading...</li>
          {{else}}
            {{#each locations}}
              <li>{{formatQuantity total}}</li>
            {{/each}}
            <li>{{formatQuantity locationsTotal}}</li>
          {{/if}}
        </ul>
      </section>
    </div>
    
  </div>
  </div>
  <div id="private-item-history-{{internalid}}" class="private-item-history" data-view="PrivateItemsHistory.View"></div>
</section>


