
<div class="private-items-header">
  <h2 class="private-items-list-title">{{title}}</h2>
  <a class="btn btn-default private-items-request-changes" data-toggle="request-modal" data-target="#requestModal" href="">Request Changes</a>
</div>
  <section class="private-item-table private-item-header">
    <div class="private-item-toggle"></div>
    <div class="private-item-image">Item</div>
    <div class="private-item-description">Description / SKU</div>
    <div class="private-item-location-inventory">
      <div class="private-item-location-inventory-item first">Location</div>
      <div class="private-item-location-inventory-item last">Avail. Inventory</div>
    </div>
    <div class="private-item-fields"></div>
    <div class="private-item-inventory"></div>
  </section>


<div data-view="PrivateItems.View"></div>
<div class="facets-facet-browse-pagination private-items-pagination" data-view="GlobalViews.Pagination"></div>

{{#unless privateItemsListIsEmpty}}
    <div class="private-items-bulk-buttons" data-view="Bulk.Buttons"></div>
{{/unless}}
