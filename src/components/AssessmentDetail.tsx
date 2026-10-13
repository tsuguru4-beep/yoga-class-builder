import type { AssessmentDef, ChangeCues } from '../types';

interface Props {
  def: AssessmentDef;
  changeCues?: ChangeCues;
}

/** 評価項目の詳細表示 */
export default function AssessmentDetail({ def, changeCues }: Props) {
  return (
    <dl className="item-detail" style={{ padding: 0, borderTop: 'none' }}>
      <dt>やり方</dt>
      <dd className="cue">{def.howToCue}</dd>
      <dt>感じてほしいポイント</dt>
      <dd>{def.focusPoints}</dd>
      <dt>痛みが出たら</dt>
      <dd>{def.stopCue}</dd>
      <dt>記録の3段階</dt>
      <dd>{def.ratingLabels.join(' ／ ')}</dd>
      {changeCues && (changeCues.improved || changeCues.subtle || changeCues.harder) && (
        <>
          <dt>アフターの声かけ</dt>
          <dd>
            <div className="mods">
              <span className="k">変化あり</span>
              <span>{changeCues.improved}</span>
              <span className="k">変化小</span>
              <span>{changeCues.subtle}</span>
              <span className="k">違和感</span>
              <span>{changeCues.harder}</span>
            </div>
          </dd>
        </>
      )}
    </dl>
  );
}
