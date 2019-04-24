<div class="private-items-cart-header">
    <h2>{{translate 'Shipment Summary'}}</h2>
    <div class="private-items-cart-sentence">
        {{translate 'Please review your shipment information and press confirm.'}}
    </div>
</div>
<div class="private-items-cart-ship-info">
    
    <div class="private-items-cart-ship-info-details">
        <div class="private-items-cart-ship-info-label">
            {{translate 'Select Shipping address:'}}
        </div>
        
        <div class="private-items-cart-ship-info-address" 
        data-view="Shipping.Address"></div>
    </div>

</div>

<div data-view="Cart.Review"></div>

{{#unless privateItemsListIsEmpty}}
<div class="private-items-cart-review">
    <!-- add child view on this  -->
    <button class="private-items-cart-submit private-items-cart-shipment-submit">{{translate 'Confirm Request'}}</button>
</div>
{{/unless}}
