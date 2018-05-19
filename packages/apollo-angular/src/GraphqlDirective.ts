import {
  Directive,
  TemplateRef,
  ViewContainerRef,
  Input,
  OnInit,
  OnDestroy,
  OnChanges,
} from '@angular/core';
import {Subject} from 'rxjs';
import {takeUntil, debounceTime} from 'rxjs/operators';
import {ApolloQueryResult} from 'apollo-client';

import {Query} from './Query';
import {QueryRef} from './QueryRef';

export interface GraphqlContext<T> {
  query: QueryRef<T>;
  result: ApolloQueryResult<T>;
  loading: boolean;
  data: T;
}

@Directive({
  selector: '[graphql]',
})
export class GraphqlDirective<T> implements OnInit, OnDestroy, OnChanges {
  @Input() public graphql: Query<T>;
  @Input() public variables: Record<any, string>;
  @Input() public debounce: number = 0;

  private ngDestroy: Subject<void>;
  private ref: QueryRef<T>;

  constructor(
    private tRef: TemplateRef<GraphqlContext<T>>,
    private vcRef: ViewContainerRef,
  ) {}

  public ngOnInit() {
    this.ngDestroy = new Subject<void>();
    this.ref = this.graphql.query(this.variables);

    this.createView({
      loading: true,
    });

    this.ref.valueChanges
      .pipe(takeUntil(this.ngDestroy), debounceTime(this.debounce))
      .subscribe(result => this.updateView(result));
  }

  public ngOnChanges() {
    // TODO: handle that
  }

  private createView(result: any) {
    this.vcRef.createEmbeddedView(this.tRef, {
      query: this.ref,
      loading: result.loading,
      data: result.data,
      result,
    });
  }

  private updateView(result: any) {
    this.createView(result);
  }

  public ngOnDestroy() {
    if (this.ngDestroy) {
      this.ngDestroy.next();
      this.ngDestroy.complete();
    }
  }
}