<div class="private-items-cart-review-items-container">
    <h2 class="private-items-cart-items-title">{{translate title}}</h2>
    <table class="private-items-cart-items-table">
      <tbody>
          
      {{#if cartLoading}}
          
          <td class="private-items-cart-items-message">Your cart is loading...</td>
          
      {{else}}
          
          {{#if items.length}}
          
          {{#each items}}
          <tr>
              <td class="private-items-cart-items-image"><img src="{{resizeImage image.url 'tinythumb'}}" alt="{{image.altimagetext}}"></td>
              <td class="private-items-cart-items-sku">
                  <span>{{translate 'SKU'}}</span><br>
                  <strong>{{sku}}</strong>
              </td>
              <td class="private-items-cart-items-qty">
                  <span>{{translate 'Quantity'}}</span><br />
                  <input type="number" min="0" {{#ifEquals ../cartName 'cartShipment'}} max="{{inventoryTotal}}" {{/ifEquals}} pattern="[0-9]*" novalidate class="private-items-cart-items-qty-input" value="{{quantity}}" data-id="{{internalid}}" />
              </td>
              <td class="private-items-cart-items-remove">
                  <div class="private-items-cart-items-remove-inner">
                      <svg viewBox="0 0 24 24" data-action="remove-item" data-id="{{internalid}}">
                          <circle cx="50%" cy="50%" r="10" fill="none" stroke="currentColor" stroke-width="2" />
                          <path d="M 8,8 L 16,16 M 8,16 L 16,8" fill="none" stroke="currentColor" stroke-width="2" />
                      </svg>
                  </div>
              </td>
          </tr>
          {{/each}}
          
          {{else}}
          
          <tr>
              <td class="private-items-cart-items-message">Your cart is empty!</td>
          </tr>
          
          {{/if}}
          
          {{/if}}
      
      </tbody>
    </table>
</div>
