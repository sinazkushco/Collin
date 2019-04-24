<div class="private-items-modal-window">
  <div class="private-items-modal-window-holder">
    <div class="private-items-modal-window-container">
    {{!-- <span class="private-close-modal"><i class="private-close-icon"></i></span> --}}
    <div class="private-items-modal-window-content">
    <div class="private-items-modal-header">
      {{#if requestImage}}
        <img src="{{requestImage}}" alt="" />
      {{/if}}
      <h2>{{requestTitle}}</h2>
    </div>
    <div class="private-items-modal-content">{{{requestSectionContent}}}</div>
    </div>
    </div>
  </div>
</div>
