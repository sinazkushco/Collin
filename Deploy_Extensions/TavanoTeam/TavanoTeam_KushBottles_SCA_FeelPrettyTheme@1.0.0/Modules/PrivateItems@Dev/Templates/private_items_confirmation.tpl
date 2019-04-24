<div class="private-items-modal-window">
  <div class="private-items-modal-window-holder">
    <div class="private-items-modal-window-container">
    {{!-- <span class="private-close-modal"><i class="private-close-icon"></i></span> --}}
    <div class="private-items-modal-window-content">
    <div class="private-items-modal-header">
      {{#if confirmationImage}}
        <img src="{{confirmationImage}}" alt="" />
      {{/if}}
      <h2>{{confirmationTitle}}</h2>
    </div>
    <div class="private-items-modal-content">{{{confirmationSectionContent}}}</div>
    </div>
    </div>
  </div>
</div>
