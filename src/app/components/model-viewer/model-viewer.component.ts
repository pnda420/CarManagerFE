import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import '@google/model-viewer';

@Component({
  selector: 'app-model-viewer',
  standalone: true,
  imports: [],
  templateUrl: './model-viewer.component.html',
  styleUrl: './model-viewer.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]  // <- Das hier hinzufügen
})
export class ModelViewerComponent {

}