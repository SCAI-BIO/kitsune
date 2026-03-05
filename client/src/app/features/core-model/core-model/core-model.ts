import { Component, OnInit } from '@angular/core';

import { LoadingSpinner } from '@shared/components/loading-spinner/loading-spinner';
import { CoreModelBase } from '../base/core-model-base';
import { CdmSelector } from '../components/cdm-selector/cdm-selector';
import { CdmTable } from '../components/cdm-table/cdm-table';

@Component({
  selector: 'app-core-model',
  standalone: true,
  imports: [CdmSelector, CdmTable, LoadingSpinner],
  templateUrl: './core-model.html',
  styleUrl: './core-model.scss',
})
export class CoreModel extends CoreModelBase implements OnInit {
  ngOnInit(): void {
    this.init();
  }
}
