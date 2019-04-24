<div class="private-items-cart-header">
    <h2>{{translate 'Re-order summary'}}</h2>
    <div class="private-items-cart-sentence">
        {{translate 'Please review your order and account information and press confirm'}}
    </div>
    <div class="private-items-cart-note">
        {{translate 'Note: $(0) will contact you to finalize the order.' salesrepName}}
    </div>
</div>
<div class="private-items-cart-ship-info">
    
    {{!--
    <div class="private-items-cart-ship-info-details">
        <div class="private-items-cart-ship-info-label">
            {{translate 'Shipping address:'}}
        </div>
        <!-- <div class="private-items-cart-ship-info-name"></div> -->
        <div class="private-items-cart-ship-info-address" 
        data-view="Shipping.Address"></div>
    </div>
     --}}

    <div class="private-items-cart-ship-info-details">
        
        <div class="private-items-cart-ship-info-label">
            {{translate 'Terms:'}}
        </div>
        <div>{{terms}}</div>
        <div class="private-items-cart-ship-info-label">
            {{translate 'Bill To:'}}
        </div>
        <div>{{billTo}}</div>
        <div class="private-items-cart-ship-info-label">
            {{translate 'Account Manager:'}}
        </div>
        <div>{{salesrepName}}</div>
        <div class="private-items-cart-ship-info-label">
            {{translate 'Account Balance:'}}
        </div>
        <div>{{accountBalance}}</div>
    </div>
</div>

<div data-view="Cart.Review"></div>

{{#unless privateItemsListIsEmpty}}
<div class="private-items-cart-review">
    <!-- add child view on this  -->
    <button class="private-items-cart-submit private-items-cart-reorder-submit">{{translate 'Confirm Reorder'}}</button>
</div>
{{/unless}}
